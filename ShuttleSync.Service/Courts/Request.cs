using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Courts;
public class CourtRequest
{
    public string? Name { get; set; }
    public string? SportType { get; set; }
    public string? SurfaceType { get; set; }
    public double? PricePerHour { get; set; }
    public List<PricingConfig>? PricingConfigs { get; set; }
    public string? Status { get; set; }
}


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
