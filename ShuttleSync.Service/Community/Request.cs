using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Community;
public sealed class ReviewRequest
{
    public string CourtId { get; set; } = "";
    public string BookingId { get; set; } = "";
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public List<string> Photos { get; set; } = [];
}

public sealed class OwnerApplicationRequest
{
    public string CourtName { get; set; } = "";
    public ApplicationAddress CourtAddress { get; set; } = new();
    public ApplicationLocation CourtLocation { get; set; } = new();
    public List<string> SportTypes { get; set; } = [];
    public string? BusinessLicense { get; set; }
    public string IdentityDocument { get; set; } = "";
    public List<string> CourtPhotos { get; set; } = [];
    public string? GooglePlaceId { get; set; }
    public string? AdditionalNotes { get; set; }
}

public sealed class ReportRequest
{
    public string? TargetUserId { get; set; }
    public string? TargetCourtId { get; set; }
    public string Reason { get; set; } = "other";
    public string Description { get; set; } = "";
    public List<string> Evidence { get; set; } = [];
}

public sealed class EventRequest
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Type { get; set; } = "announcement";
    public string? BannerImage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? CourtId { get; set; }
    public string? TournamentId { get; set; }
    public EventVoucher? Voucher { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed record ReplyRequest(string? Comment);

public sealed record EventVoucherRequest(string? Code, double BookingAmount, string? CourtId);
