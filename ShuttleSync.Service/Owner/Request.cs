using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Owner;
public sealed class VenueRequest
{
    public string? Name { get; set; }
    public GeoLocation? Location { get; set; }
    public VenueAddress? Address { get; set; }
    public VenueContact? Contact { get; set; }
    public List<string>? Sports { get; set; }
    public List<string>? Images { get; set; }
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
