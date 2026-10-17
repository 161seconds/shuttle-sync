using ShuttleSync.Service.Owner.Validator;
using ShuttleSync.Service.Courts;
using ShuttleSync.Service.Courts.Validator;
using ShuttleSync.Service.Booking;
using System.Text.Json.Nodes;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.NotificationService;
using BookingEntity = ShuttleSync.Repository.Entities.Booking;

namespace ShuttleSync.Service.Owner;
public sealed class OwnerService(MongoContext db, IBookingService bookings, INotificationService notifications) : IOwnerService
{
    public async Task<Venue?> VenueAsync(string ownerId, CancellationToken ct = default) => await db.Venues.AsQueryable().FirstOrDefaultAsync(v => v.OwnerId == ownerId, ct);
    private async Task<Venue> RequireVenueAsync(string ownerId, CancellationToken ct) => await VenueAsync(ownerId, ct) ?? throw ApiException.BadRequest("Cần tạo cơ sở trước khi thao tác");
    public async Task<Venue> CreateVenueAsync(string ownerId, VenueRequest input, CancellationToken ct = default) => await CreateVenueWithCourtsAsync(ownerId, input, [], ct);
    public async Task<Venue> CreateVenueWithCourtsAsync(string ownerId, VenueRequest input, IReadOnlyList<CourtRequest> children, CancellationToken ct = default)
    {
        var venue = new Venue
        {
            OwnerId = ownerId
        };
        OwnerValidator.Venue(venue, input, true);
        var courts = children.Select(child =>
        {
            var court = new Court
            {
                VenueId = venue.Id
            };
            CourtValidator.Apply(court, child, true);
            return court;
        }).ToList();
        using var session = await db.Client.StartSessionAsync(cancellationToken: ct);
        return await session.WithTransactionAsync(async (transaction, token) =>
        {
            // The owner write serializes concurrent venue creation without changing legacy indexes.
            var users = db.Collection<MongoDB.Bson.BsonDocument>("users");
            var claimed = await users.UpdateOneAsync(transaction, new MongoDB.Bson.BsonDocument("_id", MongoDB.Bson.ObjectId.Parse(Guard.Id(ownerId))), new MongoDB.Bson.BsonDocument("$inc", new MongoDB.Bson.BsonDocument("__v", 1)), cancellationToken: token);
            if (claimed.MatchedCount == 0)
                throw ApiException.NotFound("Tài khoản không tồn tại");
            if (await db.Venues.Find(transaction, v => v.OwnerId == ownerId).AnyAsync(token))
                throw ApiException.Conflict("Tài khoản đã sở hữu cơ sở");
            await db.Venues.InsertOneAsync(transaction, venue, cancellationToken: token);
            if (courts.Count > 0)
                await db.Courts.InsertManyAsync(transaction, courts, cancellationToken: token);
            return venue;
        }, cancellationToken: ct);
    }

    public async Task<Venue> UpdateVenueAsync(string ownerId, VenueRequest input, CancellationToken ct = default)
    {
        var venue = await RequireVenueAsync(ownerId, ct);
        OwnerValidator.Venue(venue, input, false);
        venue.UpdatedAt = DateTime.UtcNow;
        await db.Venues.ReplaceOneAsync(v => v.Id == venue.Id && v.OwnerId == ownerId, venue, cancellationToken: ct);
        return venue;
    }

    public async Task<List<Court>> CourtsAsync(string ownerId, CancellationToken ct = default)
    {
        var venue = await VenueAsync(ownerId, ct);
        return venue is null ? [] : await db.Courts.AsQueryable().Where(c => c.VenueId == venue.Id).ToListAsync(ct);
    }

    public async Task<Court> AddCourtAsync(string ownerId, CourtRequest input, CancellationToken ct = default)
    {
        var venue = await RequireVenueAsync(ownerId, ct);
        var court = new Court
        {
            VenueId = venue.Id
        };
        CourtValidator.Apply(court, input, true);
        await db.Courts.InsertOneAsync(court, cancellationToken: ct);
        return court;
    }

    public async Task<Court> UpdateCourtAsync(string ownerId, string courtId, CourtRequest input, CancellationToken ct = default)
    {
        Guard.Id(courtId);
        var venue = await RequireVenueAsync(ownerId, ct);
        return await bookings.WithCourtsAsync([courtId], async (session, token) =>
        {
            var court = await db.Courts.Find(session, c => c.Id == courtId && c.VenueId == venue.Id).FirstOrDefaultAsync(token) ?? throw ApiException.NotFound("Không tìm thấy sân");
            CourtValidator.Apply(court, input, false);
            court.UpdatedAt = DateTime.UtcNow;
            await db.Courts.ReplaceOneAsync(session, c => c.Id == courtId, court, cancellationToken: token);
            return court;
        }, ct);
    }

    public async Task<List<JsonObject>> BookingsAsync(string ownerId, CancellationToken ct = default)
    {
        var venue = await RequireVenueAsync(ownerId, ct);
        var rows = await db.Bookings.AsQueryable().Where(b => b.CourtId == venue.Id).OrderByDescending(b => b.CreatedAt).ToListAsync(ct);
        var result = new List<JsonObject>();
        foreach (var row in rows)
            result.Add(await bookings.PopulateAsync(row, true, ct));
        return result;
    }

    public async Task<OwnerScheduleResponse> ScheduleAsync(string ownerId, string? date, CancellationToken ct = default)
    {
        var day = date is null ? BookingRules.Today : BookingRules.Date(date);
        var venue = await RequireVenueAsync(ownerId, ct);
        var courts = await db.Courts.AsQueryable().Where(c => c.VenueId == venue.Id).ToListAsync(ct);
        var rows = await db.Bookings.Find(Builders<BookingEntity>.Filter.Where(b => b.CourtId == venue.Id && b.Date >= day && b.Date < day.AddDays(1)) & BookingRules.ActiveFilter(DateTime.UtcNow)).ToListAsync(ct);
        var views = new List<JsonObject>();
        foreach (var row in rows)
        {
            var view = await bookings.PopulateAsync(row, true, ct);
            // Schedule callers compare this field directly to the court ID, unlike the owner booking list.
            view["subCourtId"] = row.SubCourtId;
            views.Add(view);
        }

        return new OwnerScheduleResponse(courts, views);
    }

    public async Task<BookingEntity> BlockAsync(string ownerId, BlockSlotRequest input, CancellationToken ct = default)
    {
        var venue = await RequireVenueAsync(ownerId, ct);
        Guard.Id(input.SubCourtId);
        BookingRules.Range(input.StartTime, input.EndTime);
        var date = BookingRules.Date(input.Date);
        if (input.Notes?.Length > 500)
            throw ApiException.BadRequest("Ghi chú quá dài");
        return await bookings.WithCourtsAsync([input.SubCourtId], async (session, token) =>
        {
            if (!await db.Courts.Find(session, c => c.Id == input.SubCourtId && c.VenueId == venue.Id).AnyAsync(token))
                throw ApiException.Forbidden("Sân không thuộc cơ sở");
            await bookings.AssertAvailableAsync(session, venue.Id, input.SubCourtId, date, input.StartTime, input.EndTime, ct: token);
            var row = new BookingEntity
            {
                BookingCode = "OFFLINE_" + System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000000, 1000000000),
                CourtId = venue.Id,
                SubCourtId = input.SubCourtId,
                Date = date.AddHours(12),
                StartTime = input.StartTime,
                EndTime = input.EndTime,
                Status = "confirmed",
                Notes = input.Notes ?? "Lịch Offline / Bảo trì",
                Payment = new()
                {
                    Method = "cash",
                    Status = "paid",
                    PaidAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(1)
                },
                ConfirmedAt = DateTime.UtcNow
            };
            await db.Bookings.InsertOneAsync(session, row, cancellationToken: token);
            return row;
        }, ct);
    }

    public async Task<BookingEntity> UpdateBookingAsync(string ownerId, string bookingId, OwnerBookingRequest input, CancellationToken ct = default)
    {
        Guard.Id(bookingId);
        var venue = await RequireVenueAsync(ownerId, ct);
        var initial = await db.Bookings.AsQueryable().FirstOrDefaultAsync(b => b.Id == bookingId && b.CourtId == venue.Id, ct) ?? throw ApiException.NotFound("Không tìm thấy đơn đặt sân");
        if (input.SubCourtId is not null)
            Guard.Id(input.SubCourtId);
        if (input.Notes?.Length > 500)
            throw ApiException.BadRequest("Ghi chú quá dài");
        var result = await bookings.WithCourtsAsync([initial.SubCourtId, input.SubCourtId ?? initial.SubCourtId], async (session, token) =>
        {
            var row = await db.Bookings.Find(session, b => b.Id == bookingId && b.CourtId == venue.Id).FirstOrDefaultAsync(token) ?? throw ApiException.NotFound();
            if (row.SubCourtId != initial.SubCourtId)
                throw ApiException.Conflict("Đơn vừa được đổi sân; vui lòng thử lại");
            var status = input.Status ?? row.Status;
            if (!BookingRules.Statuses.Contains(status) || status == "no_show")
                throw ApiException.BadRequest("Trạng thái không hợp lệ");
            if (row.Status is "cancelled" or "completed" && status != row.Status)
                throw ApiException.Conflict("Không thể khôi phục đơn đã hủy hoặc hoàn tất");
            if (row.Payment.Status == "paid" && status is "cancelled" or "pending_payment")
                throw ApiException.Conflict("Đơn đã thanh toán cần đối soát hoàn tiền");
            if (status == "completed" && row.Payment.Status != "paid")
                throw ApiException.Conflict("Đơn chưa thanh toán");
            if (status == "confirmed" && row.Payment.Status != "paid" && row.Payment.ExpiresAt <= DateTime.UtcNow)
                throw ApiException.Conflict("Đơn đã hết hạn");
            var date = input.Date is null ? row.Date : BookingRules.Date(input.Date).AddHours(12);
            var start = input.StartTime ?? row.StartTime;
            var end = input.EndTime ?? row.EndTime;
            var courtId = input.SubCourtId ?? row.SubCourtId;
            BookingRules.Range(start, end);
            if (!await db.Courts.Find(session, c => c.Id == courtId && c.VenueId == venue.Id).AnyAsync(token))
                throw ApiException.Forbidden("Sân không thuộc cơ sở");
            if (status != "cancelled")
                await bookings.AssertAvailableAsync(session, venue.Id, courtId, date, start, end, [row.Id], token);
            var confirmed = status == "confirmed" && row.Status != "confirmed";
            row.Status = status;
            row.Date = date;
            row.StartTime = start;
            row.EndTime = end;
            row.SubCourtId = courtId;
            if (input.Notes is not null)
                row.Notes = input.Notes;
            if (status == "cancelled")
                row.CancelledAt = DateTime.UtcNow;
            if (confirmed)
            {
                row.Payment.Status = "paid";
                row.Payment.PaidAt = row.ConfirmedAt = DateTime.UtcNow;
            }

            row.UpdatedAt = DateTime.UtcNow;
            await db.Bookings.ReplaceOneAsync(session, b => b.Id == row.Id, row, cancellationToken: token);
            return (Row: row, Notify: confirmed);
        }, ct);
        if (result.Notify && result.Row.UserId is not null)
            await notifications.CreateAsync(result.Row.UserId, "Đơn đặt sân đã được xác nhận", "Thanh toán thành công và đơn đặt sân đã được duyệt.", "booking", ct: ct);
        return result.Row;
    }

    public async Task NotifyAsync(string ownerId, string bookingId, string message, CancellationToken ct = default)
    {
        Guard.Id(bookingId);
        message = Guard.Text(message, "Nội dung", 2000);
        var venue = await RequireVenueAsync(ownerId, ct);
        var row = await db.Bookings.AsQueryable().FirstOrDefaultAsync(b => b.Id == bookingId && b.CourtId == venue.Id, ct) ?? throw ApiException.NotFound();
        if (row.UserId is null)
            throw ApiException.BadRequest("Không thể gửi thông báo cho khách vãng lai");
        await notifications.CreateAsync(row.UserId, "Thông báo từ chủ sân", message, "booking", ct: ct);
    }

    public async Task<object> StatsAsync(string ownerId, CancellationToken ct = default)
    {
        var venue = await VenueAsync(ownerId, ct);
        var days = Enumerable.Range(0, 30).Select(i => BookingRules.Today.AddDays(i - 29)).ToList();
        var trend = days.Select(d => new { date = d.ToString("yyyy-MM-dd"), revenue = 0d, count = 0 }).ToList();
        if (venue is null)
            return new
            {
                hasVenue = false,
                totalCourts = 0,
                totalBookings = 0,
                totalRevenue = 0,
                totalExpenses = 0,
                netProfit = 0,
                bookingTrend = trend,
                bookingTrendBySport = days.Select(d => new { date = d.ToString("yyyy-MM-dd") }),
                bookingsByStatus = Array.Empty<object>(),
                expensesByCategory = Array.Empty<object>(),
                recentBookings = Array.Empty<object>(),
                venueSports = Array.Empty<string>()
            };
        var from = BookingRules.Today.AddDays(-29);
        var until = BookingRules.Today.AddDays(1);
        var rows = await db.Bookings.AsQueryable().Where(b => b.CourtId == venue.Id).ToListAsync(ct);
        var paid = rows.Where(b => b.Date >= from && b.Date < until && b.Payment.Status == "paid" && b.Status is "confirmed" or "completed").ToList();
        var courts = await db.Courts.AsQueryable().Where(c => c.VenueId == venue.Id).ToListAsync(ct);
        var expenses = await db.Expenses.AsQueryable().Where(e => e.VenueId == venue.Id && e.Date >= from && e.Date < until).ToListAsync(ct);
        var sports = venue.Sports.Count == 0 ? BookingRules.Sports.ToList() : venue.Sports;
        var sportsTrend = days.Select(day =>
        {
            var value = new Dictionary<string, object>
            {
                ["date"] = day.ToString("yyyy-MM-dd")
            };
            foreach (var sport in sports)
                value[sport] = paid.Where(b => b.Date.Date == day.Date && courts.Any(c => c.Id == b.SubCourtId && c.SportType == sport)).Sum(b => b.FinalAmount);
            return value;
        }).ToList();
        var recent = new List<JsonObject>();
        foreach (var row in rows.OrderByDescending(b => b.CreatedAt).Take(10))
            recent.Add(await bookings.PopulateAsync(row, true, ct));
        var revenue = paid.Sum(b => b.FinalAmount);
        var cost = expenses.Sum(e => e.Amount);
        return new
        {
            hasVenue = true,
            venueId = venue.Id,
            venueName = venue.Name,
            venueSports = venue.Sports,
            totalCourts = courts.Count,
            totalBookings = paid.Count,
            totalRevenue = revenue,
            totalExpenses = cost,
            netProfit = revenue - cost,
            bookingTrend = days.Select(day => new { date = day.ToString("yyyy-MM-dd"), revenue = paid.Where(b => b.Date.Date == day.Date).Sum(b => b.FinalAmount), count = paid.Count(b => b.Date.Date == day.Date) }),
            bookingTrendBySport = sportsTrend,
            bookingsByStatus = rows.Where(b => b.CreatedAt >= from && b.CreatedAt < until).GroupBy(b => b.Status).Select(g => new { name = g.Key, value = g.Count() }),
            expensesByCategory = expenses.GroupBy(e => e.Category).Select(g => new { name = g.Key, value = g.Sum(e => e.Amount) }),
            recentBookings = recent
        };
    }

    public async Task<List<Expense>> ExpensesAsync(string ownerId, int? month, int? year, CancellationToken ct = default)
    {
        var venue = await RequireVenueAsync(ownerId, ct);
        var query = db.Expenses.AsQueryable().Where(e => e.VenueId == venue.Id);
        if (month.HasValue != year.HasValue || month is < 1 or > 12 || year is < 1900 or > 9998)
            throw ApiException.BadRequest("Tháng năm không hợp lệ");
        if (month.HasValue)
        {
            var start = new DateTime(year!.Value, month.Value, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);
            query = query.Where(e => e.Date >= start && e.Date < end);
        }

        return await query.OrderByDescending(e => e.Date).ToListAsync(ct);
    }

    public async Task<Expense> CreateExpenseAsync(string ownerId, ExpenseRequest input, CancellationToken ct = default)
    {
        var venue = await RequireVenueAsync(ownerId, ct);
        var expense = new Expense
        {
            VenueId = venue.Id
        };
        OwnerValidator.Expense(expense, input, true);
        await db.Expenses.InsertOneAsync(expense, cancellationToken: ct);
        return expense;
    }

    public async Task<Expense> UpdateExpenseAsync(string ownerId, string id, ExpenseRequest input, CancellationToken ct = default)
    {
        Guard.Id(id);
        var venue = await RequireVenueAsync(ownerId, ct);
        var row = await db.Expenses.AsQueryable().FirstOrDefaultAsync(e => e.Id == id && e.VenueId == venue.Id, ct) ?? throw ApiException.NotFound();
        OwnerValidator.Expense(row, input, false);
        row.UpdatedAt = DateTime.UtcNow;
        await db.Expenses.ReplaceOneAsync(e => e.Id == id && e.VenueId == venue.Id, row, cancellationToken: ct);
        return row;
    }

    public async Task DeleteExpenseAsync(string ownerId, string id, CancellationToken ct = default)
    {
        Guard.Id(id);
        var venue = await RequireVenueAsync(ownerId, ct);
        if ((await db.Expenses.DeleteOneAsync(e => e.Id == id && e.VenueId == venue.Id, ct)).DeletedCount == 0)
            throw ApiException.NotFound();
    }

}
