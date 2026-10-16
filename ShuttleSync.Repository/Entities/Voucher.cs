using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class Voucher : Entity
{
    public string Code { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string? VenueId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? OwnerId { get; set; }
    public string DiscountType { get; set; } = "fixed";
    public double DiscountValue { get; set; }
    public double? MaxDiscount { get; set; }
    public double MinOrderValue { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public string Status { get; set; } = "PENDING";
    public bool IsActive { get; set; } = true;
}
