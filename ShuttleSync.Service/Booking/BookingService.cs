using System.Security.Cryptography;
using System.Text.Json.Nodes;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.NotificationService;
using BookingEntity = ShuttleSync.Repository.Entities.Booking;

namespace ShuttleSync.Service.Booking;
public sealed class BookingService(MongoContext db, INotificationService notifications)
{
    public async Task InitializeIndexesAsync(CancellationToken ct = default)
    {
        await db.Bookings.Indexes.CreateManyAsync([new(Builders<BookingEntity>.IndexKeys.Ascending(b => b.BookingCode), new CreateIndexOptions { Unique = true }), new(Builders<BookingEntity>.IndexKeys.Ascending(b => b.GroupId)), new(Builders<BookingEntity>.IndexKeys.Ascending(b => b.UserId).Descending(b => b.Date)), new(Builders<BookingEntity>.IndexKeys.Ascending(b => b.CourtId).Ascending(b => b.Date).Ascending(b => b.Status)), new(Builders<BookingEntity>.IndexKeys.Ascending(b => b.Payment.TransactionId), new CreateIndexOptions<BookingEntity> { Unique = true, PartialFilterExpression = Builders<BookingEntity>.Filter.Type(b => b.Payment.TransactionId, BsonType.String) })], ct);
        await db.Courts.Indexes.CreateOneAsync(new CreateIndexModel<Court>(Builders<Court>.IndexKeys.Ascending(c => c.VenueId).Ascending(c => c.Status)), cancellationToken: ct);
        await db.Vouchers.Indexes.CreateOneAsync(new CreateIndexModel<Voucher>(Builders<Voucher>.IndexKeys.Ascending(v => v.Code), new CreateIndexOptions { Unique = true }), cancellationToken: ct);
        await db.Venues.Indexes.CreateOneAsync(new CreateIndexModel<Venue>(Builders<Venue>.IndexKeys.Geo2DSphere(v => v.Location)), cancellationToken: ct);
        await db.TimeSlots.Indexes.CreateOneAsync(new CreateIndexModel<TimeSlot>(Builders<TimeSlot>.IndexKeys.Ascending(s => s.CourtId).Ascending(s => s.SubCourtId).Ascending(s => s.Date).Ascending(s => s.StartTime), new CreateIndexOptions { Unique = true }), cancellationToken: ct);
    }

    public async Task<T> WithCourtsAsync<T>(IEnumerable<string> ids, Func<IClientSessionHandle, CancellationToken, Task<T>> action, CancellationToken ct = default)
    {
        using var session = await db.Client.StartSessionAsync(cancellationToken: ct);
        return await session.WithTransactionAsync(async (transaction, token) =>
        {
            // A shared document write before the availability read prevents snapshot write skew.
            foreach (var id in ids.Distinct().Order())
            {
                Guard.Id(id);
                var result = await db.Courts.UpdateOneAsync(transaction, c => c.Id == id, Builders<Court>.Update.Inc(c => c.Version, 1), cancellationToken: token);
                if (result.MatchedCount == 0)
                    throw ApiException.NotFound("Sân không tồn tại");
            }

            return await action(transaction, token);
        }, cancellationToken: ct);
    }

    public static FilterDefinition<BookingEntity> ActiveFilter(DateTime now) => Builders<BookingEntity>.Filter.Where(b => b.Status == "confirmed" || b.Status == "completed" || (b.Status == "pending_payment" && b.Payment.ExpiresAt > now));
    public async Task AssertAvailableAsync(IClientSessionHandle session, string venueId, string courtId, DateTime date, string start, string end, IEnumerable<string>? excluded = null, CancellationToken ct = default)
    {
        var ids = excluded?.ToArray() ?? [];
        var day = date.Date;
        var filter = Builders<BookingEntity>.Filter.Where(b => b.CourtId == venueId && b.SubCourtId == courtId && b.Date >= day && b.Date < day.AddDays(1) && !ids.Contains(b.Id)) & Builders<BookingEntity>.Filter.Lt(b => b.StartTime, end) & Builders<BookingEntity>.Filter.Gt(b => b.EndTime, start) & ActiveFilter(DateTime.UtcNow);
        if (await db.Bookings.Find(session, filter).AnyAsync(ct))
            throw ApiException.Conflict("Sân đã có người đặt trong khung giờ này");
    }

    public async Task<object> CreateAsync(string userId, CreateBookingRequest input, CancellationToken ct = default)
    {
        var dates = BookingRules.Dates(input);
        var result = await WithCourtsAsync([input.SubCourtId], async (session, token) =>
        {
            var court = await db.Courts.Find(session, c => c.Id == input.SubCourtId).FirstOrDefaultAsync(token);
            if (court.VenueId != input.CourtId || court.Status != "AVAILABLE")
                throw ApiException.BadRequest("Sân không thuộc cơ sở hoặc đang bảo trì");
            if (!await db.Venues.Find(session, v => v.Id == input.CourtId && v.IsActive).AnyAsync(token))
                throw ApiException.BadRequest("Cơ sở không hoạt động");
            var existing = await db.Bookings.Find(session, Builders<BookingEntity>.Filter.Where(b => b.CourtId == input.CourtId && b.SubCourtId == input.SubCourtId) & ActiveFilter(DateTime.UtcNow)).ToListAsync(token);
            var overlaps = existing.Where(b => dates.Any(d => d.Date == b.Date.Date) && BookingRules.Overlaps(input.StartTime, input.EndTime, b.StartTime, b.EndTime)).ToList();
            if (overlaps.Any(b => b.UserId != userId || b.Status != "pending_payment"))
                throw ApiException.Conflict("Sân đã có người đặt trong khung giờ này");
            var own = overlaps.Where(b => b.UserId == userId).ToList();
            if (own.Count == dates.Count && own.All(b => b.StartTime == input.StartTime && b.EndTime == input.EndTime && dates.Any(d => d.Date == b.Date.Date)))
                return own;
            foreach (var old in own)
                await db.Bookings.UpdateOneAsync(session, b => b.Id == old.Id, Builders<BookingEntity>.Update.Set(b => b.Status, "cancelled").Set(b => b.CancelledAt, DateTime.UtcNow).Set(b => b.CancelReason, "Thay bằng phiên đặt sân mới").Set(b => b.UpdatedAt, DateTime.UtcNow), cancellationToken: token);
            var expires = DateTime.UtcNow.AddMinutes(15);
            var group = dates.Count > 1 ? "GRP" + RandomNumberGenerator.GetInt32(100000000, 1000000000) : null;
            var rows = dates.Select(date => new BookingEntity { BookingCode = "BK" + RandomNumberGenerator.GetInt32(100000000, 1000000000), GroupId = group, UserId = userId, CourtId = input.CourtId, SubCourtId = input.SubCourtId, Date = date.AddHours(12), StartTime = input.StartTime, EndTime = input.EndTime, Type = input.Type, TotalAmount = BookingRules.Price(court, date, input.StartTime, input.EndTime), Payment = new() { ExpiresAt = expires } }).ToList();
            var total = rows.Sum(b => b.TotalAmount);
            if (input.VoucherCode is not null)
            {
                var code = Guard.Text(input.VoucherCode, "Mã giảm giá", 100).ToUpperInvariant();
                var now = DateTime.UtcNow;
                var filter = Builders<Voucher>.Filter.Where(v => v.Code == code && v.IsActive && v.Status == "APPROVED" && v.StartDate <= now && v.EndDate >= now && (v.VenueId == null || v.VenueId == input.CourtId) && v.MinOrderValue <= total) & new BsonDocumentFilterDefinition<Voucher>(new BsonDocument("$expr", new BsonDocument("$lt", new BsonArray { "$usedCount", "$usageLimit" })));
                var voucher = await db.Vouchers.FindOneAndUpdateAsync(session, filter, Builders<Voucher>.Update.Inc(v => v.UsedCount, 1), new() { ReturnDocument = ReturnDocument.After }, token);
                if (voucher is null)
                    throw ApiException.BadRequest("Mã giảm giá không hợp lệ hoặc đã hết lượt");
                var discount = VoucherService.Discount(voucher, total);
                var remaining = discount;
                for (var i = 0; i < rows.Count; i++)
                {
                    rows[i].Discount = i == rows.Count - 1 ? remaining : Math.Min(remaining, Math.Floor(discount * rows[i].TotalAmount / (total == 0 ? 1 : total)));
                    remaining -= rows[i].Discount;
                    rows[i].VoucherCode = voucher.Code;
                }
            }

            foreach (var row in rows)
                row.FinalAmount = row.TotalAmount - row.Discount;
            await db.Bookings.InsertManyAsync(session, rows, cancellationToken: token);
            return rows;
        }, ct);
        var code = result[0].GroupId ?? result[0].BookingCode;
        object? notification = null;
        try
        {
            notification = await notifications.CreateAsync(userId, "Chờ thanh toán", $"Đơn đặt sân {code} đang chờ thanh toán.", "booking", $"/payment/{code}", ct: ct);
        }
        catch (Exception e)when (e is not OperationCanceledException)
        {
            Console.Error.WriteLine($"Notification failed: {e.Message}");
        }

        return new
        {
            bookingCode = code,
            finalAmount = result.Sum(b => b.FinalAmount),
            bookings = result,
            expiresAt = result[0].Payment.ExpiresAt,
            notification
        };
    }

    public async Task<List<JsonObject>> MineAsync(string userId, string? status, string? startDate, string? endDate, CancellationToken ct = default)
    {
        if (status is not null && !BookingRules.Statuses.Contains(status))
            throw ApiException.BadRequest("Trạng thái không hợp lệ");
        var start = startDate is null ? (DateTime? )null : BookingRules.Date(startDate);
        var end = endDate is null ? (DateTime? )null : BookingRules.Date(endDate);
        if (start > end)
            throw ApiException.BadRequest("Ngày kết thúc phải từ ngày bắt đầu");
        await db.Bookings.UpdateManyAsync(b => b.UserId == userId && b.Status == "confirmed" && b.Date < BookingRules.Today, Builders<BookingEntity>.Update.Set(b => b.Status, "completed").Set(b => b.UpdatedAt, DateTime.UtcNow), cancellationToken: ct);
        var query = db.Bookings.AsQueryable().Where(b => b.UserId == userId);
        if (status is not null)
            query = query.Where(b => b.Status == status);
        if (start.HasValue)
            query = query.Where(b => b.Date >= start.Value);
        if (end.HasValue)
        {
            var until = end.Value.AddDays(1);
            query = query.Where(b => b.Date < until);
        }

        var bookings = await query.OrderByDescending(b => b.Date).ThenByDescending(b => b.CreatedAt).ToListAsync(ct);
        var ids = bookings.Select(b => b.Id).ToArray();
        var groupRows = await db.Collection<BsonDocument>("groupplays").Find(Builders<BsonDocument>.Filter.In("bookingId", ids.Select(ObjectId.Parse))).Project(Builders<BsonDocument>.Projection.Include("bookingId")).ToListAsync(ct);
        var used = groupRows.Where(g => g.Contains("bookingId") && !g["bookingId"].IsBsonNull).Select(g => g["bookingId"].ToString()).ToHashSet();
        var result = new List<JsonObject>();
        foreach (var booking in bookings)
        {
            var view = await PopulateAsync(booking, false, ct);
            view["hasGroupPlay"] = used.Contains(booking.Id);
            result.Add(view);
        }

        return result;
    }

    public async Task<JsonObject> PopulateAsync(BookingEntity booking, bool owner, CancellationToken ct = default)
    {
        var view = BookingRules.View(booking);
        if (owner)
        {
            var court = await db.Courts.AsQueryable().FirstOrDefaultAsync(c => c.Id == booking.SubCourtId, ct);
            BookingRules.Put(view, "subCourtId", court);
            if (booking.UserId is not null)
            {
                var user = await db.Collection<BsonDocument>("users").Find(new BsonDocument("_id", ObjectId.Parse(booking.UserId))).Project(new BsonDocument { { "displayName", 1 }, { "email", 1 }, { "phone", 1 }, { "avatar", 1 } }).FirstOrDefaultAsync(ct);
                view["userId"] = user is null ? null : UserView(user);
            }
        }
        else
            BookingRules.Put(view, "courtId", await db.Venues.AsQueryable().FirstOrDefaultAsync(v => v.Id == booking.CourtId, ct));
        return view;
    }

    public static JsonObject UserView(BsonDocument user)
    {
        var node = new JsonObject
        {
            ["_id"] = user["_id"].ToString()
        };
        foreach (var key in new[]
        {
            "displayName",
            "email",
            "phone",
            "avatar"
        }

        )
            if (user.TryGetValue(key, out var value) && !value.IsBsonNull)
                node[key] = value.ToString();
        return node;
    }

    public async Task<List<BookingEntity>> ByCodeAsync(string code, string userId, CancellationToken ct = default)
    {
        var rows = await db.Bookings.AsQueryable().Where(b => b.UserId == userId && (b.BookingCode == code || b.GroupId == code)).ToListAsync(ct);
        if (rows.Count == 0)
            throw ApiException.NotFound("Không tìm thấy đơn đặt sân");
        return rows;
    }

    public async Task<BookingEntity> ByIdAsync(string id, string userId, CancellationToken ct = default)
    {
        Guard.Id(id);
        return await db.Bookings.AsQueryable().FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, ct) ?? throw ApiException.NotFound("Không tìm thấy đơn đặt sân");
    }

    public async Task<List<object>> CourtBookingsAsync(string venueId, string? date, CancellationToken ct = default)
    {
        Guard.Id(venueId);
        var filter = Builders<BookingEntity>.Filter.Eq(b => b.CourtId, venueId) & ActiveFilter(DateTime.UtcNow);
        if (date is not null)
        {
            var d = BookingRules.Date(date);
            filter &= Builders<BookingEntity>.Filter.Gte(b => b.Date, d) & Builders<BookingEntity>.Filter.Lt(b => b.Date, d.AddDays(1));
        }

        var rows = await db.Bookings.Find(filter).ToListAsync(ct);
        return rows.Select(b => (object)new { _id = b.Id, subCourtId = b.SubCourtId, b.StartTime, b.EndTime, b.Date, b.Status }).ToList();
    }

    public async Task<BookingEntity> CancelAsync(string id, string userId, string? reason, CancellationToken ct = default)
    {
        if (reason?.Length > 500)
            throw ApiException.BadRequest("Lý do hủy không hợp lệ");
        var initial = await ByIdAsync(id, userId, ct);
        return await WithCourtsAsync([initial.SubCourtId], async (session, token) =>
        {
            var booking = await db.Bookings.Find(session, b => b.Id == id && b.UserId == userId).FirstOrDefaultAsync(token) ?? throw ApiException.NotFound();
            if (booking.SubCourtId != initial.SubCourtId)
                throw ApiException.Conflict("Đơn vừa được đổi sân; vui lòng thử lại");
            if (booking.Status == "cancelled")
                return booking;
            if (booking.Status != "pending_payment" || booking.Payment.Status == "paid")
                throw ApiException.Conflict("Đơn đã thanh toán cần chủ sân xử lý hoàn tiền");
            booking.Status = "cancelled";
            booking.CancelReason = reason;
            booking.CancelledAt = booking.UpdatedAt = DateTime.UtcNow;
            await db.Bookings.ReplaceOneAsync(session, b => b.Id == id, booking, cancellationToken: token);
            return booking;
        }, ct);
    }

    public async Task<BookingEntity> ConfirmAsync(string code, PaymentTransaction payment, CancellationToken ct = default)
    {
        Guard.Text(payment.Id, "Mã giao dịch", 200);
        BookingRules.Money(payment.Amount);
        if (payment.Amount <= 0)
            throw ApiException.BadRequest("Giao dịch không hợp lệ");
        var initial = await db.Bookings.AsQueryable().Where(b => b.BookingCode == code || b.GroupId == code).ToListAsync(ct);
        if (initial.Count == 0)
            throw ApiException.NotFound("Không tìm thấy đơn đặt sân");
        var result = await WithCourtsAsync(initial.Select(b => b.SubCourtId), async (session, token) =>
        {
            var rows = await db.Bookings.Find(session, b => b.BookingCode == code || b.GroupId == code).SortBy(b => b.Id).ToListAsync(token);
            if (rows.Any(row => !initial.Any(old => old.SubCourtId == row.SubCourtId)))
                throw ApiException.Conflict("Đơn vừa được đổi sân; vui lòng thử lại");
            var previous = await db.Bookings.Find(session, b => b.Payment.TransactionId == payment.Id).FirstOrDefaultAsync(token);
            if (previous is not null)
            {
                if (!rows.Any(b => b.Id == previous.Id))
                    throw ApiException.Conflict("Giao dịch đã được sử dụng cho đơn khác");
                return (Booking: rows[0], Changed: false);
            }

            var now = DateTime.UtcNow;
            if (rows.Any(b => b.Status != "pending_payment" || b.Payment.Status != "pending" || b.Payment.ExpiresAt <= now))
                throw ApiException.Conflict("Đơn không còn chờ thanh toán; cần đối soát giao dịch");
            if (payment.Amount < rows.Sum(b => b.FinalAmount))
                throw ApiException.BadRequest("Số tiền thanh toán không đủ");
            var ids = rows.Select(b => b.Id).ToArray();
            foreach (var row in rows)
            {
                await AssertAvailableAsync(session, row.CourtId, row.SubCourtId, row.Date, row.StartTime, row.EndTime, ids, token);
                row.Status = "confirmed";
                row.Payment.Status = "paid";
                row.Payment.PaidAt = row.ConfirmedAt = row.UpdatedAt = now;
                if (row.Id == rows[0].Id)
                    row.Payment.TransactionId = payment.Id;
                await db.Bookings.ReplaceOneAsync(session, b => b.Id == row.Id, row, cancellationToken: token);
            }

            return (Booking: rows[0], Changed: true);
        }, ct);
        if (result.Changed)
        {
            var venue = await db.Venues.AsQueryable().FirstOrDefaultAsync(v => v.Id == result.Booking.CourtId, ct);
            foreach (var user in new[]
            {
                result.Booking.UserId,
                venue?.OwnerId
            }.Where(u => u is not null).Distinct())
                try
                {
                    await notifications.CreateAsync(user!, "Thanh toán thành công", $"Đơn đặt sân {code} đã thanh toán thành công.", "booking", ct: ct);
                }
                catch (Exception e)when (e is not OperationCanceledException)
                {
                    Console.Error.WriteLine($"Notification failed: {e.Message}");
                }
        }

        return result.Booking;
    }

    public async Task<string> PaymentStatusAsync(string code, CancellationToken ct = default) => (await db.Bookings.AsQueryable().FirstOrDefaultAsync(b => b.BookingCode == code || b.GroupId == code, ct))?.Status ?? "PENDING";
    public async Task<long> CleanupExpiredAsync(CancellationToken ct = default) => (await db.Bookings.UpdateManyAsync(b => b.Status == "pending_payment" && b.Payment.ExpiresAt <= DateTime.UtcNow, Builders<BookingEntity>.Update.Set(b => b.Status, "cancelled").Set(b => b.CancelReason, "Hết hạn thanh toán").Set(b => b.CancelledAt, DateTime.UtcNow).Set(b => b.UpdatedAt, DateTime.UtcNow), cancellationToken: ct)).ModifiedCount;
}
