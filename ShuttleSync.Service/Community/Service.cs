using ShuttleSync.Service.Community.Validator;
using System.Security.Cryptography;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Community;
public sealed class Service(MongoContext db) : ICommunityService
{
    public async Task EnsureIndexesAsync(CancellationToken ct = default)
    {
        await db.Reviews.Indexes.CreateManyAsync([new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(x => x.BookingId), new CreateIndexOptions { Unique = true }), new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.CourtId), new CreateIndexOptions { Unique = true })], ct);
        await db.OwnerApplications.Indexes.CreateOneAsync(new CreateIndexModel<OwnerApplication>(Builders<OwnerApplication>.IndexKeys.Ascending(x => x.UserId), new CreateIndexOptions<OwnerApplication> { Name = "unique_pending_application_user", Unique = true, PartialFilterExpression = Builders<OwnerApplication>.Filter.In(x => x.Status, ["pending", "under_review"]) }), cancellationToken: ct);
        await db.Events.Indexes.CreateOneAsync(new CreateIndexModel<Event>(Builders<Event>.IndexKeys.Ascending("voucher.code"), new CreateIndexOptions<Event> { Name = "unique_event_voucher_code", Unique = true, PartialFilterExpression = new BsonDocument("voucher.code", new BsonDocument("$type", "string")) }), cancellationToken: ct);
    }

    public async Task<Review> ReviewAsync(string userId, ReviewRequest request, CancellationToken ct)
    {
        CommunityValidator.Review(request);
        var review = new Review
        {
            UserId = userId,
            CourtId = request.CourtId,
            BookingId = request.BookingId,
            Rating = request.Rating,
            Comment = request.Comment,
            Photos = request.Photos
        };
        using var session = await db.Client.StartSessionAsync(cancellationToken: ct);
        return await session.WithTransactionAsync(async (s, c) =>
        {
            var booking = await db.Collection<BsonDocument>("bookings").Find(s, new BsonDocument { { "_id", ObjectId.Parse(review.BookingId) }, { "userId", ObjectId.Parse(userId) }, { "courtId", ObjectId.Parse(review.CourtId) }, { "status", "completed" } }).FirstOrDefaultAsync(c);
            if (booking is null)
                throw ApiException.BadRequest("Only a completed booking can be reviewed");
            await db.Reviews.InsertOneAsync(s, review, cancellationToken: c);
            var venue = await db.Collection<Venue>("venues").UpdateOneAsync(s, x => x.Id == review.CourtId, Builders<Venue>.Update.Inc(x => x.Rating.TotalScore, review.Rating).Inc(x => x.Rating.ReviewsCount, 1), cancellationToken: c);
            if (venue.MatchedCount == 0)
                throw ApiException.NotFound("Court not found");
            return review;
        }, cancellationToken: ct);
    }

    public async Task<(object Data, object Pagination)> ReviewsAsync(string courtId, int page, int limit, CancellationToken ct)
    {
        courtId = Guard.Id(courtId);
        (page, limit) = Guard.Page(page, limit);
        var total = await db.Reviews.CountDocumentsAsync(x => x.CourtId == courtId, cancellationToken: ct);
        var reviews = await db.Reviews.Find(x => x.CourtId == courtId).SortByDescending(x => x.CreatedAt).Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        var result = new List<BsonDocument>();
        foreach (var review in reviews)
        {
            var doc = review.ToBsonDocument();
            var user = await db.Users.Find(x => x.Id == review.UserId).FirstOrDefaultAsync(ct);
            doc["userId"] = user is null ? BsonNull.Value : new BsonDocument
            {
                {
                    "_id",
                    ObjectId.Parse(user.Id)
                },
                {
                    "displayName",
                    user.DisplayName
                },
                {
                    "avatar",
                    (BsonValue? )user.Avatar ?? BsonNull.Value
                }
            };
            result.Add(doc);
        }

        return (result, Guard.Pagination(page, limit, total));
    }

    public async Task<Review> ReplyAsync(string id, string ownerId, string? comment, CancellationToken ct)
    {
        var review = await db.Reviews.Find(x => x.Id == Guard.Id(id)).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
        if (!await db.Collection<Venue>("venues").Find(x => x.Id == review.CourtId && x.OwnerId == ownerId).AnyAsync(ct))
            throw ApiException.Forbidden();
        return await db.Reviews.FindOneAndUpdateAsync(x => x.Id == id, Builders<Review>.Update.Set(x => x.Reply, new ReviewReply { UserId = ownerId, Comment = Guard.Text(comment, "Comment", 1000) }), new FindOneAndUpdateOptions<Review> { ReturnDocument = ReturnDocument.After }, ct);
    }

    public async Task<OwnerApplication> ApplyAsync(string userId, OwnerApplicationRequest request, CancellationToken ct)
    {
        var address = CommunityValidator.Application(request);
        if (await db.OwnerApplications.Find(x => x.UserId == userId && (x.Status == "pending" || x.Status == "under_review")).AnyAsync(ct))
            throw ApiException.Conflict("Application already pending");
        var application = new OwnerApplication
        {
            UserId = userId,
            CourtName = Guard.Text(request.CourtName, "Court name", 100, 2),
            CourtAddress = address,
            CourtLocation = request.CourtLocation,
            SportTypes = request.SportTypes,
            IdentityDocument = Guard.Text(request.IdentityDocument, "Identity document", 2000),
            BusinessLicense = request.BusinessLicense,
            CourtPhotos = request.CourtPhotos,
            GooglePlaceId = request.GooglePlaceId,
            AdditionalNotes = request.AdditionalNotes
        };
        await db.OwnerApplications.InsertOneAsync(application, cancellationToken: ct);
        return application;
    }

    public async Task<List<OwnerApplication>> ApplicationsAsync(string userId, CancellationToken ct) => await db.OwnerApplications.Find(x => x.UserId == userId).SortByDescending(x => x.CreatedAt).ToListAsync(ct);
    public async Task<Report> ReportAsync(string userId, ReportRequest request, CancellationToken ct)
    {
        CommunityValidator.Report(request);
        var report = new Report
        {
            ReporterId = userId,
            TargetUserId = request.TargetUserId,
            TargetCourtId = request.TargetCourtId,
            Reason = request.Reason,
            Description = Guard.Text(request.Description, "Description", 1000, 5),
            Evidence = request.Evidence
        };
        await db.Reports.InsertOneAsync(report, cancellationToken: ct);
        return report;
    }

    public async Task<Event> EventAsync(string userId, EventRequest request, CancellationToken ct)
    {
        var voucher = CommunityValidator.Event(request);
        var item = new Event
        {
            CreatedBy = userId,
            Title = Guard.Text(request.Title, "Title", 200),
            Description = Guard.Text(request.Description, "Description", 5000),
            Type = request.Type,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CourtId = request.CourtId,
            TournamentId = request.TournamentId,
            IsActive = request.IsActive,
            BannerImage = request.BannerImage,
            Voucher = voucher
        };
        await db.Events.InsertOneAsync(item, cancellationToken: ct);
        return item;
    }

    public async Task<(object Data, object Pagination)> EventsAsync(string? type, int page, int limit, CancellationToken ct)
    {
        (page, limit) = Guard.Page(page, limit);
        var now = DateTime.UtcNow;
        var filter = Builders<Event>.Filter.Where(x => x.IsActive && x.StartDate <= now && x.EndDate >= now);
        if (type is not null)
            filter &= Builders<Event>.Filter.Eq(x => x.Type, type);
        var total = await db.Events.CountDocumentsAsync(filter, cancellationToken: ct);
        var items = await db.Events.Find(filter).SortByDescending(x => x.StartDate).Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        var result = new List<BsonDocument>();
        foreach (var item in items)
            result.Add(await EventDocument(item, ct));
        return (result, Guard.Pagination(page, limit, total));
    }

    async Task<BsonDocument> EventDocument(Event item, CancellationToken ct)
    {
        var doc = item.ToBsonDocument();
        if (item.CourtId is not null)
        {
            var venue = await db.Collection<BsonDocument>("venues").Find(new BsonDocument("_id", ObjectId.Parse(item.CourtId))).FirstOrDefaultAsync(ct);
            doc["courtId"] = venue is null ? BsonNull.Value : new BsonDocument(venue.Elements.Where(e => new[] { "_id", "name", "slug", "address" }.Contains(e.Name)));
        }

        if (item.TournamentId is not null)
            doc["tournamentId"] = (BsonValue? )await db.Collection<BsonDocument>("tournaments").Find(new BsonDocument("_id", ObjectId.Parse(item.TournamentId))).FirstOrDefaultAsync(ct) ?? BsonNull.Value;
        return doc;
    }

    public async Task<object> GetEventAsync(string id, CancellationToken ct) => await EventDocument(await db.Events.Find(x => x.Id == Guard.Id(id)).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound(), ct);
    public async Task<EventVoucherResponse> ValidateVoucherAsync(string? code, double amount, string? courtId, CancellationToken ct)
    {
        code = CommunityValidator.Voucher(code, amount, courtId);
        var now = DateTime.UtcNow;
        var item = await db.Events.Find(x => x.IsActive && x.StartDate <= now && x.EndDate >= now && x.Voucher != null && x.Voucher.Code == code).FirstOrDefaultAsync(ct);
        var voucher = item?.Voucher ?? throw ApiException.NotFound("Invalid voucher");
        if (voucher.UsedCount >= voucher.UsageLimit || voucher.ExpiresAt < now || amount < (voucher.MinBookingAmount ?? 0))
            throw ApiException.BadRequest("Voucher expired or unavailable");
        if (voucher.ApplicableCourtIds.Count > 0 && (courtId is null || !voucher.ApplicableCourtIds.Contains(courtId)))
            throw ApiException.BadRequest("Voucher does not apply to this court");
        var discount = voucher.Type == "percentage" ? Math.Min(Math.Floor(amount * voucher.Value / 100), voucher.MaxDiscount ?? double.MaxValue) : voucher.Type == "fixed_amount" ? voucher.Value : 0;
        return new EventVoucherResponse(voucher.Code, Math.Min(discount, amount), voucher.Type, voucher.Value);
    }
}
