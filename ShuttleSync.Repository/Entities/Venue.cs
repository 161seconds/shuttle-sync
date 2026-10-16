using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class Venue : Entity
{
    public string Name { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string? OwnerId { get; set; }
    public string? GooglePlaceId { get; set; }
    public GeoLocation Location { get; set; } = new();
    public VenueAddress Address { get; set; } = new();
    public VenueContact Contact { get; set; } = new();
    public List<string> Sports { get; set; } = [];
    public VenueRating Rating { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public List<string> Images { get; set; } = [];
}

public sealed class GeoLocation
{
    public string Type { get; set; } = "Point";
    public double[] Coordinates { get; set; } = [0, 0];
}

public sealed class VenueAddress
{
    public string Street { get; set; } = "";
    public string State { get; set; } = "";
    public string City { get; set; } = "";
    public string CountryCode { get; set; } = "VN";
}

public sealed class VenueContact
{
    public string Phone { get; set; } = "";
    public string Website { get; set; } = "";
}

public sealed class VenueRating
{
    public double TotalScore { get; set; }
    public int ReviewsCount { get; set; }
}
