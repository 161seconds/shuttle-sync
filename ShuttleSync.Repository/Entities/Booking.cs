using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class Booking : Entity
{
    public string BookingCode { get; set; } = "";

    [BsonIgnoreIfNull]
    public string? GroupId { get; set; }

    [BsonRepresentation(BsonType.ObjectId), BsonIgnoreIfNull]
    public string? UserId { get; set; }

    [BsonIgnoreIfNull]
    public GuestInfo? GuestInfo { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string CourtId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string SubCourtId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> SlotIds { get; set; } = [];
    public DateTime Date { get; set; }
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public string Type { get; set; } = "casual";
    public string Status { get; set; } = "pending_payment";
    public double TotalAmount { get; set; }
    public double Discount { get; set; }
    public double FinalAmount { get; set; }

    [BsonIgnoreIfNull]
    public string? VoucherCode { get; set; }
    public BookingPayment Payment { get; set; } = new();

    [BsonIgnoreIfNull]
    public string? Notes { get; set; }

    [BsonIgnoreIfNull]
    public string? CancelReason { get; set; }

    [BsonIgnoreIfNull]
    public DateTime? CancelledAt { get; set; }

    [BsonIgnoreIfNull]
    public DateTime? ConfirmedAt { get; set; }
}

public sealed class GuestInfo
{
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
}

public sealed class BookingPayment
{
    public string Method { get; set; } = "qr_code";
    public string Status { get; set; } = "pending";

    [BsonIgnoreIfNull]
    public string? TransactionId { get; set; }

    [BsonIgnoreIfNull]
    public string? QrCodeUrl { get; set; }

    [BsonIgnoreIfNull]
    public DateTime? PaidAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}
