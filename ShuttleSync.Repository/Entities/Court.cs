using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class Court : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string VenueId { get; set; } = "";
    public string Name { get; set; } = "";
    public string SportType { get; set; } = "BADMINTON";
    public string SurfaceType { get; set; } = "SYNTHETIC";
    public double PricePerHour { get; set; }
    public List<PricingConfig> PricingConfigs { get; set; } = [];
    public string Status { get; set; } = "AVAILABLE";
}

public sealed class PricingConfig
{
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public List<int> DaysOfWeek { get; set; } = [];
    public double PricePerHour { get; set; }
}
