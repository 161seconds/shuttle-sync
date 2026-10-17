using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Vouchers;
public sealed record VoucherValidationResponse(Voucher Voucher, double DiscountAmount);
