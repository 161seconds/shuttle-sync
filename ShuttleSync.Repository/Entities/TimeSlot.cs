using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class TimeSlot : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string CourtId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string SubCourtId { get; set; } = "";
    public DateTime Date { get; set; }
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public string Status { get; set; } = "available";
    public double Price { get; set; }

    [BsonRepresentation(BsonType.ObjectId), BsonIgnoreIfNull]
    public string? LockedBy { get; set; }

    [BsonIgnoreIfNull]
    public DateTime? LockedAt { get; set; }

    [BsonRepresentation(BsonType.ObjectId), BsonIgnoreIfNull]
    public string? BookingId { get; set; }
}
