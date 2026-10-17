using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Vouchers;
public sealed class VoucherRequest
{
    public string? Code { get; set; }
    public string? VenueId { get; set; }
    public string? DiscountType { get; set; }
    public double? DiscountValue { get; set; }
    public double? MaxDiscount { get; set; }
    public double? MinOrderValue { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? UsageLimit { get; set; }
    public bool? IsActive { get; set; }
}


public sealed record VoucherApprovalRequest(string Status);

public sealed record ValidateVoucherRequest(string Code, string VenueId, double TotalAmount);
