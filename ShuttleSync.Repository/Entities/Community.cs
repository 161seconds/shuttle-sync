using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class Review : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string CourtId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string BookingId { get; set; } = "";
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public List<string> Photos { get; set; } = [];
    public ReviewReply? Reply { get; set; }
}

public sealed class ReviewReply
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = "";
    public string Comment { get; set; } = "";
    public DateTime RepliedAt { get; set; } = DateTime.UtcNow;
}

public sealed class OwnerApplication : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = "";
    public string CourtName { get; set; } = "";
    public ApplicationAddress CourtAddress { get; set; } = new();
    public ApplicationLocation CourtLocation { get; set; } = new();
    public List<string> SportTypes { get; set; } = [];
    public string? BusinessLicense { get; set; }
    public string IdentityDocument { get; set; } = "";
    public List<string> CourtPhotos { get; set; } = [];
    public string? GooglePlaceId { get; set; }
    public string? AdditionalNotes { get; set; }
    public string Status { get; set; } = "pending";

    [BsonRepresentation(BsonType.ObjectId)]
    public string? ReviewedBy { get; set; }
    public string? ReviewNotes { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

public sealed class ApplicationAddress
{
    public string Street { get; set; } = "";
    public string Ward { get; set; } = "";
    public string District { get; set; } = "";
    public string City { get; set; } = "Ho Chi Minh";
    public string FullAddress { get; set; } = "";
}

public sealed class ApplicationLocation
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public sealed class Report : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string ReporterId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string? TargetUserId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? TargetCourtId { get; set; }
    public string Reason { get; set; } = "other";
    public string Description { get; set; } = "";
    public List<string> Evidence { get; set; } = [];
    public string Status { get; set; } = "pending";
    public string? Resolution { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public sealed class Event : Entity
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Type { get; set; } = "announcement";
    public string? BannerImage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? CourtId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? TournamentId { get; set; }
    public EventVoucher? Voucher { get; set; }
    public bool IsActive { get; set; } = true;

    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedBy { get; set; } = "";
}

public sealed class EventVoucher
{
    public string Code { get; set; } = "";
    public string Type { get; set; } = "percentage";
    public double Value { get; set; }
    public double? MinBookingAmount { get; set; }
    public double? MaxDiscount { get; set; }
    public int UsageLimit { get; set; } = 100;
    public int UsedCount { get; set; }
    public DateTime? ExpiresAt { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> ApplicableCourtIds { get; set; } = [];
    public List<string> ApplicableSportTypes { get; set; } = [];
}
