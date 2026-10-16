using System.Text.Json.Nodes;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Booking;
public sealed class VoucherService(MongoContext db)
{
    public static double Discount(Voucher voucher, double total)
    {
        BookingRules.Money(total);
        BookingRules.Money(voucher.DiscountValue);
        if (voucher.MaxDiscount.HasValue)
            BookingRules.Money(voucher.MaxDiscount.Value);
        return Math.Min(total, voucher.DiscountType == "percentage" ? Math.Min(total * voucher.DiscountValue / 100, voucher.MaxDiscount ?? double.PositiveInfinity) : voucher.DiscountValue);
    }

    public async Task<object> AllAsync(CancellationToken ct = default)
    {
        var result = new List<JsonObject>();
        foreach (var voucher in await db.Vouchers.AsQueryable().OrderByDescending(v => v.CreatedAt).ToListAsync(ct))
        {
            var view = BookingRules.View(voucher);
            if (voucher.VenueId is not null)
            {
                var venue = await db.Venues.AsQueryable().FirstOrDefaultAsync(v => v.Id == voucher.VenueId, ct);
                BookingRules.Put(view, "venueId", venue is null ? null : new { _id = venue.Id, venue.Name });
            }

            if (voucher.OwnerId is not null)
            {
                var owner = await db.Collection<MongoDB.Bson.BsonDocument>("users").Find(new MongoDB.Bson.BsonDocument("_id", MongoDB.Bson.ObjectId.Parse(voucher.OwnerId))).Project(new MongoDB.Bson.BsonDocument { { "displayName", 1 }, { "email", 1 } }).FirstOrDefaultAsync(ct);
                view["ownerId"] = owner is null ? null : BookingService.UserView(owner);
            }

            result.Add(view);
        }

        return result;
    }

    public async Task<List<Voucher>> MineAsync(string userId, CancellationToken ct = default) => await db.Vouchers.AsQueryable().Where(v => v.OwnerId == userId).OrderByDescending(v => v.CreatedAt).ToListAsync(ct);
    public async Task<Voucher> ApproveAsync(string id, string status, CancellationToken ct = default)
    {
        Guard.Id(id);
        if (status is not ("APPROVED" or "REJECTED"))
            throw ApiException.BadRequest("Trạng thái không hợp lệ");
        return await db.Vouchers.FindOneAndUpdateAsync(v => v.Id == id, Builders<Voucher>.Update.Set(v => v.Status, status).Set(v => v.UpdatedAt, DateTime.UtcNow), new() { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound("Không tìm thấy voucher");
    }

    public async Task<Voucher> CreateAsync(string userId, VoucherRequest input, bool global, CancellationToken ct = default)
    {
        var voucher = new Voucher
        {
            OwnerId = userId,
            Status = global ? "APPROVED" : "PENDING"
        };
        Apply(voucher, input, true);
        if (!global)
        {
            voucher.VenueId = Guard.Id(input.VenueId);
            if (!await db.Venues.AsQueryable().AnyAsync(v => v.Id == voucher.VenueId && v.OwnerId == userId, ct))
                throw ApiException.Forbidden("Cơ sở không thuộc tài khoản");
        }

        await db.Vouchers.InsertOneAsync(voucher, cancellationToken: ct);
        return voucher;
    }

    public async Task<Voucher> UpdateAsync(string userId, string role, string id, VoucherRequest input, CancellationToken ct = default)
    {
        Guard.Id(id);
        if (role is not ("admin" or "court_owner"))
            throw ApiException.Forbidden();
        var voucher = await db.Vouchers.AsQueryable().FirstOrDefaultAsync(v => v.Id == id, ct) ?? throw ApiException.NotFound("Không tìm thấy voucher");
        if (role != "admin" && voucher.OwnerId != userId)
            throw ApiException.Forbidden();
        Apply(voucher, input, false);
        if (role != "admin")
            voucher.Status = "PENDING";
        voucher.UpdatedAt = DateTime.UtcNow;
        // Limit edits cannot erase usage claimed concurrently by a booking transaction.
        var update = Builders<Voucher>.Update.Set(v => v.Code, voucher.Code).Set(v => v.DiscountType, voucher.DiscountType).Set(v => v.DiscountValue, voucher.DiscountValue).Set(v => v.MaxDiscount, voucher.MaxDiscount).Set(v => v.MinOrderValue, voucher.MinOrderValue).Set(v => v.StartDate, voucher.StartDate).Set(v => v.EndDate, voucher.EndDate).Set(v => v.UsageLimit, voucher.UsageLimit).Set(v => v.IsActive, voucher.IsActive).Set(v => v.Status, voucher.Status).Set(v => v.UpdatedAt, voucher.UpdatedAt);
        return await db.Vouchers.FindOneAndUpdateAsync(v => v.Id == id, update, new() { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound();
    }

    public async Task DeleteAsync(string userId, string role, string id, CancellationToken ct = default)
    {
        Guard.Id(id);
        if (role is not ("admin" or "court_owner"))
            throw ApiException.Forbidden();
        var voucher = await db.Vouchers.AsQueryable().FirstOrDefaultAsync(v => v.Id == id, ct) ?? throw ApiException.NotFound();
        if (role != "admin" && voucher.OwnerId != userId)
            throw ApiException.Forbidden();
        await db.Vouchers.DeleteOneAsync(v => v.Id == id, ct);
    }

    public async Task<object> ValidateAsync(ValidateVoucherRequest input, CancellationToken ct = default)
    {
        var code = Guard.Text(input.Code, "Mã giảm giá", 100).ToUpperInvariant();
        Guard.Id(input.VenueId);
        BookingRules.Money(input.TotalAmount);
        var now = DateTime.UtcNow;
        var voucher = await db.Vouchers.AsQueryable().FirstOrDefaultAsync(v => v.Code == code && v.IsActive && v.Status == "APPROVED" && v.StartDate <= now && v.EndDate >= now && v.UsedCount < v.UsageLimit, ct) ?? throw ApiException.BadRequest("Mã giảm giá không hợp lệ hoặc đã hết lượt");
        if (voucher.VenueId is not null && voucher.VenueId != input.VenueId)
            throw ApiException.BadRequest("Mã không áp dụng cho cơ sở này");
        if (input.TotalAmount < voucher.MinOrderValue)
            throw ApiException.BadRequest("Đơn hàng chưa đạt giá trị tối thiểu");
        return new
        {
            voucher,
            discountAmount = Discount(voucher, input.TotalAmount)
        };
    }

    private static void Apply(Voucher voucher, VoucherRequest input, bool create)
    {
        if (create || input.Code is not null)
            voucher.Code = Guard.Text(input.Code, "Mã giảm giá", 100).ToUpperInvariant();
        if (create || input.DiscountType is not null)
        {
            if (input.DiscountType is not ("percentage" or "fixed"))
                throw ApiException.BadRequest("Loại giảm giá không hợp lệ");
            voucher.DiscountType = input.DiscountType;
        }

        if (create && !input.DiscountValue.HasValue)
            throw ApiException.BadRequest("Thiếu giá trị giảm giá");
        if (input.DiscountValue.HasValue)
            voucher.DiscountValue = input.DiscountValue.Value;
        if (input.MaxDiscount.HasValue)
            voucher.MaxDiscount = input.MaxDiscount.Value;
        if (input.MinOrderValue.HasValue)
            voucher.MinOrderValue = input.MinOrderValue.Value;
        if (input.StartDate.HasValue)
            voucher.StartDate = input.StartDate.Value.ToUniversalTime();
        if (input.EndDate.HasValue)
            voucher.EndDate = input.EndDate.Value.ToUniversalTime();
        if (input.UsageLimit.HasValue)
            voucher.UsageLimit = input.UsageLimit.Value;
        if (input.IsActive.HasValue)
            voucher.IsActive = input.IsActive.Value;
        BookingRules.Money(voucher.DiscountValue);
        BookingRules.Money(voucher.MinOrderValue);
        if (voucher.MaxDiscount.HasValue)
            BookingRules.Money(voucher.MaxDiscount.Value);
        if (voucher.DiscountType == "percentage" && voucher.DiscountValue > 100)
            throw ApiException.BadRequest("Phần trăm giảm giá không được vượt 100");
        if (voucher.UsageLimit < 1 || voucher.StartDate == default || voucher.EndDate < voucher.StartDate)
            throw ApiException.BadRequest("Giới hạn lượt hoặc ngày áp dụng không hợp lệ");
    }
}
