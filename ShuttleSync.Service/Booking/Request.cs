using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Booking;
public sealed class CreateBookingRequest
{
    public string CourtId { get; set; } = "";
    public string SubCourtId { get; set; } = "";
    public List<string>? SlotIds { get; set; }
    public string Date { get; set; } = "";
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public string Type { get; set; } = "casual";
    public int? Months { get; set; }
    public List<int>? DaysOfWeek { get; set; }
    public string? VoucherCode { get; set; }
}

public sealed record CancelBookingRequest(string? Reason);
public sealed record PaymentTransaction(string Id, double Amount);
public sealed class WebhookRequest
{
    public string? AccountNumber { get; set; }
    public string? Content { get; set; }
    public string? TransferType { get; set; }
    public double TransferAmount { get; set; }
    public System.Text.Json.JsonElement ReferenceCode { get; set; }
    public System.Text.Json.JsonElement Id { get; set; }
}

public sealed class VenueRequest
{
    public string? Name { get; set; }
    public GeoLocation? Location { get; set; }
    public VenueAddress? Address { get; set; }
    public VenueContact? Contact { get; set; }
    public List<string>? Sports { get; set; }
    public List<string>? Images { get; set; }
}

public class CourtRequest
{
    public string? Name { get; set; }
    public string? SportType { get; set; }
    public string? SurfaceType { get; set; }
    public double? PricePerHour { get; set; }
    public List<PricingConfig>? PricingConfigs { get; set; }
    public string? Status { get; set; }
}

public sealed class OwnerBookingRequest
{
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public string? Date { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? SubCourtId { get; set; }
}

public sealed class BlockSlotRequest
{
    public string SubCourtId { get; set; } = "";
    public string Date { get; set; } = "";
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public string? Notes { get; set; }
}

public sealed record BookingNotificationRequest(string Message);
public sealed class ExpenseRequest
{
    public double? Amount { get; set; }
    public string? Category { get; set; }
    public string? Date { get; set; }
    public string? Description { get; set; }
}

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
public sealed class CourtSearchRequest
{
    public string? Q { get; set; }
    public string? SportType { get; set; }
    public string? District { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public string? Date { get; set; }
    public bool? IsIndoor { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public double? Radius { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 12;
}

public sealed class CreateCourtRequest : VenueRequestBase
{
    public List<CreateCourtChild> Courts { get; set; } = [];
    public List<LegacySportPrice> PricePerHour { get; set; } = [];
}

public class VenueRequestBase
{
    public string Name { get; set; } = "";
    public LegacyLocation Location { get; set; } = new();
    public LegacyVenueAddress Address { get; set; } = new();
    public VenueContact Contact { get; set; } = new();
    public List<string> SportTypes { get; set; } = [];
    public List<string> Images { get; set; } = [];
}

public sealed class LegacyLocation
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public sealed class LegacyVenueAddress
{
    public string Street { get; set; } = "";
    public string Ward { get; set; } = "";
    public string District { get; set; } = "";
    public string City { get; set; } = "Hồ Chí Minh";
    public string FullAddress { get; set; } = "";
}

public sealed class CreateCourtChild : CourtRequest
{
    public bool IsIndoor { get; set; }
    public string? Surface { get; set; }
}

public sealed class LegacySportPrice
{
    public string SportType { get; set; } = "";
    public List<PricingConfig> TimeSlots { get; set; } = [];
}
