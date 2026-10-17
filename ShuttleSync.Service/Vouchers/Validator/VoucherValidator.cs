using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.Service.Vouchers.Validator;
public static class VoucherValidator
{
    public static void Apply(Voucher voucher, VoucherRequest input, bool create)
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

    public static string Code(ValidateVoucherRequest input)
    {
        var code = Guard.Text(input.Code, "Mã giảm giá", 100).ToUpperInvariant();
        Guard.Id(input.VenueId);
        BookingRules.Money(input.TotalAmount);
        return code;
    }
}
