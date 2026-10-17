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
