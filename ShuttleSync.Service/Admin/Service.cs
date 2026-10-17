using ShuttleSync.Service.Admin.Validator;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.NotificationService;

namespace ShuttleSync.Service.Admin;
public sealed class Service(MongoContext db, IRealtime realtime, INotificationService notifications) : IAdminService
{
    static ObjectId Id(string id) => ObjectId.Parse(Guard.Id(id));
    IMongoCollection<BsonDocument> Collection(string name) => db.Collection<BsonDocument>(name);
    async Task Populate(List<BsonDocument> docs, string key, string collection, string[] fields, CancellationToken ct)
    {
        foreach (var doc in docs)
        {
            if (!doc.TryGetValue(key, out var value) || value.BsonType != BsonType.ObjectId)
                continue;
            var found = await Collection(collection).Find(new BsonDocument("_id", value)).FirstOrDefaultAsync(ct);
            doc[key] = found is null ? BsonNull.Value : new BsonDocument(found.Elements.Where(x => x.Name == "_id" || fields.Contains(x.Name)));
        }
    }

    public async Task<(object Data, object Pagination)> ListAsync(string name, string? status, string? role, string? search, string? date, int page, int limit, CancellationToken ct)
    {
        (page, limit) = Guard.Page(page, limit);
        var filter = new BsonDocument();
        if (!string.IsNullOrEmpty(status))
            filter["status"] = status;
        if (name == "users")
        {
            if (!string.IsNullOrEmpty(role))
                filter["role"] = role;
            if (!string.IsNullOrEmpty(search))
                filter["$or"] = new BsonArray
                {
                    new BsonDocument("displayName", new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(Guard.Text(search, "search", 100)), "i")),
                    new BsonDocument("email", new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(search), "i"))
                };
        }

        if (name == "bookings" && !string.IsNullOrEmpty(date))
        {
            if (!DateTime.TryParse(date, out var day))
                throw ApiException.BadRequest("Invalid date");
            day = DateTime.SpecifyKind(day.Date, DateTimeKind.Utc);
            filter["createdAt"] = new BsonDocument
            {
                {
                    "$gte",
                    day
                },
                {
                    "$lt",
                    day.AddDays(1)
                }
            };
        }

        var collection = Collection(name);
        var total = await collection.CountDocumentsAsync(filter, cancellationToken: ct);
        var docs = await collection.Find(filter).Sort(new BsonDocument("createdAt", -1)).Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        if (name == "ownerapplications")
            await Populate(docs, "userId", "users", ["displayName", "email", "phone"], ct);
        if (name == "reports")
        {
            await Populate(docs, "reporterId", "users", ["displayName", "email"], ct);
            await Populate(docs, "targetUserId", "users", ["displayName", "email"], ct);
            await Populate(docs, "targetCourtId", "venues", ["name"], ct);
        }

        if (name == "courts")
            await Populate(docs, "ownerId", "users", ["displayName", "email", "phone"], ct);
        if (name == "bookings")
        {
            await Populate(docs, "courtId", "venues", ["name", "sports"], ct);
            await Populate(docs, "userId", "users", ["displayName", "email", "phone"], ct);
        }

        return (docs.Select(AdminResponse.Json).ToArray(), Guard.Pagination(page, limit, total));
    }

    public async Task<User> BanAsync(string id, string adminId, string? reason, DateTime? expiry, CancellationToken ct)
    {
        id = Guard.Id(id);
        reason = AdminValidator.Ban(reason, expiry);
        var user = await db.Users.Find(x => x.Id == id).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
        if (user.Role == "admin")
            throw ApiException.Forbidden("Cannot ban an administrator");
        user = await db.Users.FindOneAndUpdateAsync(x => x.Id == id && x.Role != "admin", Builders<User>.Update.Set(x => x.Status, "banned").Set(x => x.BanInfo, new BanInfo { Reason = reason, BannedAt = DateTime.UtcNow, BannedBy = adminId, ExpiresAt = expiry }).Set(x => x.RefreshTokens, new List<string>()).Inc(x => x.TokenVersion, 1), new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.Conflict("Account changed");
        await realtime.DisconnectAsync(id, ct);
        await notifications.CreateAsync(id, "Account banned", "Account banned. Reason: " + reason, ct: ct);
        return user;
    }

    public async Task<User> UnbanAsync(string id, CancellationToken ct)
    {
        var user = await db.Users.FindOneAndUpdateAsync(x => x.Id == Guard.Id(id), Builders<User>.Update.Set(x => x.Status, "active").Unset(x => x.BanInfo), new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound();
        await notifications.CreateAsync(id, "Account unbanned", "Your account is unbanned.", ct: ct);
        return user;
    }

    public async Task<object> CourtStatusAsync(string id, string? status, string adminId, CancellationToken ct)
    {
        AdminValidator.CourtStatus(status);
        var doc = await Collection("courts").FindOneAndUpdateAsync(new BsonDocument("_id", Id(id)), new BsonDocument("$set", new BsonDocument { { "status", status }, { "updatedAt", DateTime.UtcNow } }), new FindOneAndUpdateOptions<BsonDocument> { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound();
        return AdminResponse.Json(doc)!;
    }

    public async Task<object> ResolveAsync(string id, string adminId, string? resolution, string? status, CancellationToken ct)
    {
        (resolution, status) = AdminValidator.Resolution(resolution, status);
        var report = await Collection("reports").FindOneAndUpdateAsync(new BsonDocument("_id", Id(id)), new BsonDocument("$set", new BsonDocument { { "status", status }, { "resolution", resolution }, { "resolvedBy", Id(adminId) }, { "resolvedAt", DateTime.UtcNow }, { "updatedAt", DateTime.UtcNow } }), new FindOneAndUpdateOptions<BsonDocument> { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound();
        return AdminResponse.Json(report)!;
    }

    public async Task<object> ReviewAsync(string id, string adminId, string? status, string? notes, CancellationToken ct)
    {
        AdminValidator.ApplicationStatus(status);
        using var session = await db.Client.StartSessionAsync(cancellationToken: ct);
        var app = await session.WithTransactionAsync(async (s, c) =>
        {
            var application = await Collection("ownerapplications").Find(s, new BsonDocument("_id", Id(id))).FirstOrDefaultAsync(c) ?? throw ApiException.NotFound();
            if (application.GetValue("status", "") == "approved")
            {
                if (status == "approved")
                    return application;
                throw ApiException.Conflict("Application already approved");
            }

            var userId = application["userId"].AsObjectId.ToString();
            if (status == "approved")
            {
                var user = await db.Users.FindOneAndUpdateAsync(s, Builders<User>.Filter.Eq(x => x.Id, userId), Builders<User>.Update.Set(x => x.Role, "court_owner"), new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After }, c) ?? throw ApiException.NotFound();
                if (!await db.Collection<Venue>("venues").Find(s, x => x.OwnerId == userId).AnyAsync(c))
                {
                    var address = application["courtAddress"].AsBsonDocument;
                    var location = application["courtLocation"].AsBsonDocument;
                    var venue = new Venue
                    {
                        Name = application["courtName"].AsString,
                        OwnerId = userId,
                        Sports = application["sportTypes"].AsBsonArray.Select(x => x.AsString.ToUpperInvariant()).ToList(),
                        Address = new VenueAddress
                        {
                            Street = address.GetValue("street", "").AsString,
                            State = address.GetValue("ward", "").AsString,
                            City = address.GetValue("district", "").AsString
                        },
                        Location = new GeoLocation
                        {
                            Coordinates = [location["lng"].ToDouble(), location["lat"].ToDouble()]
                        },
                        Contact = new VenueContact
                        {
                            Phone = user.Phone ?? ""
                        },
                        Images = application.GetValue("courtPhotos", new BsonArray()).AsBsonArray.Select(x => x.AsString).ToList(),
                        GooglePlaceId = application.GetValue("googlePlaceId", BsonNull.Value).IsBsonNull ? null : application["googlePlaceId"].AsString
                    };
                    await db.Collection<Venue>("venues").InsertOneAsync(s, venue, cancellationToken: c);
                }
            }

            var update = new BsonDocument("$set", new BsonDocument { { "status", status }, { "reviewedBy", Id(adminId) }, { "reviewNotes", (BsonValue? )notes ?? BsonNull.Value }, { "reviewedAt", DateTime.UtcNow }, { "updatedAt", DateTime.UtcNow } });
            var result = await Collection("ownerapplications").FindOneAndUpdateAsync(s, new BsonDocument("_id", Id(id)), update, new FindOneAndUpdateOptions<BsonDocument> { ReturnDocument = ReturnDocument.After }, c);
            await Collection("notifications").InsertOneAsync(s, new BsonDocument { { "_id", ObjectId.GenerateNewId() }, { "userId", Id(userId) }, { "title", "Owner application " + status }, { "message", notes ?? "Application reviewed" }, { "type", "system" }, { "isRead", false }, { "createdAt", DateTime.UtcNow }, { "updatedAt", DateTime.UtcNow } }, cancellationToken: c);
            return result;
        }, cancellationToken: ct);
        return AdminResponse.Json(app)!;
    }

    public async Task<object> DashboardAsync(CancellationToken ct)
    {
        async Task<long> Count(string name, BsonDocument filter) => await Collection(name).CountDocumentsAsync(filter, cancellationToken: ct);
        var confirmed = new BsonDocument("status", new BsonDocument("$in", new BsonArray { "confirmed", "completed" }));
        var bookings = await Collection("bookings").Find(confirmed).ToListAsync(ct);
        var today = DateTime.UtcNow.Date;
        var users = await Collection("users").Find(new BsonDocument("createdAt", new BsonDocument("$gte", today.AddDays(-29)))).ToListAsync(ct);
        var userGrowth = Enumerable.Range(0, 30).Select(i => new { date = today.AddDays(i - 29).ToString("yyyy-MM-dd"), count = users.Count(u => u.GetValue("createdAt", BsonNull.Value).IsValidDateTime && u["createdAt"].ToUniversalTime().Date == today.AddDays(i - 29)) }).ToArray();
        var bookingTrend = Enumerable.Range(0, 30).Select(i =>
        {
            var date = today.AddDays(i - 29);
            var day = bookings.Where(b => b.GetValue("createdAt", BsonNull.Value).IsValidDateTime && b["createdAt"].ToUniversalTime().Date == date).ToArray();
            return new
            {
                date = date.ToString("yyyy-MM-dd"),
                count = day.Length,
                revenue = day.Sum(x => x.GetValue("finalAmount", 0).ToDouble())
            };
        }).ToArray();
        var venues = await Collection("venues").Find(new BsonDocument()).ToListAsync(ct);
        var topCourts = bookings.GroupBy(b => b["courtId"]).OrderByDescending(g => g.Count()).Take(10).Select(g => new { courtId = g.Key.ToString(), name = venues.FirstOrDefault(v => v["_id"] == g.Key)?.GetValue("name", "").AsString, bookings = g.Count(), revenue = g.Sum(x => x.GetValue("finalAmount", 0).ToDouble()) }).ToArray();
        var recent = await Collection("bookings").Find(new BsonDocument()).Sort(new BsonDocument("createdAt", -1)).Limit(10).ToListAsync(ct);
        await Populate(recent, "courtId", "venues", ["name", "sports"], ct);
        await Populate(recent, "userId", "users", ["displayName", "email"], ct);
        var ratio = bookings.GroupBy(b => venues.FirstOrDefault(v => v["_id"] == b["courtId"])?.GetValue("sports", new BsonArray()).AsBsonArray.FirstOrDefault()?.AsString ?? "Other").Select(g => new { name = g.Key, value = g.Count() }).ToArray();
        return new
        {
            totalUsers = await Count("users", new BsonDocument("status", "active")),
            totalCourts = await Count("venues", new BsonDocument("isActive", true)),
            totalBookings = bookings.Count,
            totalRevenue = bookings.Sum(b => b.GetValue("finalAmount", 0).ToDouble()),
            activeGroupPlays = await Count("groupplays", new BsonDocument("status", "open")),
            pendingApplications = await Count("ownerapplications", new BsonDocument("status", "pending")),
            pendingReports = await Count("reports", new BsonDocument("status", "pending")),
            userGrowth,
            bookingTrend,
            topCourts,
            recentBookings = recent.Select(AdminResponse.Json).ToArray(),
            bookingRatio = ratio
        };
    }
}
