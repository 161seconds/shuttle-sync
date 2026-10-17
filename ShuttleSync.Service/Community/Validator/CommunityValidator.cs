using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using System.Security.Cryptography;

namespace ShuttleSync.Service.Community.Validator;
public static class CommunityValidator
{
    public static void Review(ReviewRequest request)
    {
        Guard.Id(request.CourtId);
        Guard.Id(request.BookingId);
        if (request.Rating < 1 || request.Rating > 5)
            throw ApiException.BadRequest("Rating must be between 1 and 5");
        if (request.Comment?.Length > 1000)
            throw ApiException.BadRequest("Comment too long");
    }

    public static ApplicationAddress Application(OwnerApplicationRequest request)
    {
        var address = request.CourtAddress ?? throw ApiException.BadRequest("Address required");
        if (request.CourtLocation is null || request.SportTypes is null || request.CourtPhotos is null)
            throw ApiException.BadRequest("Invalid application");
        if (request.CourtPhotos.Any(x => !Uri.TryCreate(x, UriKind.Absolute, out _)))
            throw ApiException.BadRequest("Invalid photo URL");
        Guard.Text(address.Street, "Street", 200);
        Guard.Text(address.Ward, "Ward", 100);
        Guard.Text(address.District, "District", 100);
        Guard.Text(address.FullAddress, "Address", 500);
        if (!double.IsFinite(request.CourtLocation.Lat) || !double.IsFinite(request.CourtLocation.Lng) || Math.Abs(request.CourtLocation.Lat) > 90 || Math.Abs(request.CourtLocation.Lng) > 180)
            throw ApiException.BadRequest("Invalid coordinates");
        if (request.SportTypes.Count == 0 || request.SportTypes.Any(x => !new[] { "badminton", "pickleball" }.Contains(x)))
            throw ApiException.BadRequest("Invalid sports");
        if (request.AdditionalNotes?.Length > 1000)
            throw ApiException.BadRequest("Notes too long");
        return address;
    }

    public static void Report(ReportRequest request)
    {
        if (request.TargetUserId is not null)
            Guard.Id(request.TargetUserId);
        if (request.TargetCourtId is not null)
            Guard.Id(request.TargetCourtId);
        if (!new[]
        {
            "spam",
            "harassment",
            "no_show",
            "inappropriate_behavior",
            "fake_court",
            "other"
        }.Contains(request.Reason))
            throw ApiException.BadRequest("Invalid reason");
    }

    public static EventVoucher? Event(EventRequest request)
    {
        if (request.StartDate == default || request.EndDate <= request.StartDate)
            throw ApiException.BadRequest("Invalid event dates");
        if (!new[]
        {
            "tournament",
            "voucher",
            "promotion",
            "announcement"
        }.Contains(request.Type))
            throw ApiException.BadRequest("Invalid event type");
        if (request.CourtId is not null)
            Guard.Id(request.CourtId);
        if (request.TournamentId is not null)
            Guard.Id(request.TournamentId);
        var voucher = request.Voucher;
        if (voucher is not null)
        {
            if (!new[]
            {
                "percentage",
                "fixed_amount",
                "free_slot"
            }.Contains(voucher.Type) || !double.IsFinite(voucher.Value) || voucher.Value < 0 || (voucher.Type == "percentage" && voucher.Value > 100) || voucher.UsageLimit < 1 || voucher.MinBookingAmount < 0 || voucher.MaxDiscount < 0)
                throw ApiException.BadRequest("Invalid voucher");
            voucher.Code = string.IsNullOrWhiteSpace(voucher.Code) ? "SS-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(4)) : Guard.Text(voucher.Code, "Voucher code", 50).ToUpperInvariant();
            voucher.UsedCount = 0;
            foreach (var id in voucher.ApplicableCourtIds)
                Guard.Id(id);
        }
        return voucher;
    }

    public static string Voucher(string? code, double amount, string? courtId)
    {
        code = Guard.Text(code, "Code", 50).ToUpperInvariant();
        if (!double.IsFinite(amount) || amount < 0)
            throw ApiException.BadRequest("Invalid booking amount");
        if (courtId is not null)
            Guard.Id(courtId);
        return code;
    }
}
