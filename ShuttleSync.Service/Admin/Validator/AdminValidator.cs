using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Admin.Validator;
public static class AdminValidator
{
    public static string Ban(string? reason, DateTime? expiry)
    {
        reason = Guard.Text(reason, "Reason", 1000);
        if (expiry.HasValue && expiry <= DateTime.UtcNow)
            throw ApiException.BadRequest("Expiry must be in the future");
        return reason;
    }

    public static void CourtStatus(string? status)
    {
        if (!new[]
        {
            "pending_approval",
            "active",
            "inactive",
            "rejected"
        }.Contains(status))
            throw ApiException.BadRequest("Invalid court status");
    }

    public static (string Resolution, string Status) Resolution(string? resolution, string? status)
    {
        resolution = Guard.Text(resolution, "Resolution", 2000);
        status ??= "resolved";
        if (!new[]
        {
            "pending",
            "reviewing",
            "resolved",
            "dismissed"
        }.Contains(status))
            throw ApiException.BadRequest("Invalid report status");
        return (resolution, status);
    }

    public static void ApplicationStatus(string? status)
    {
        if (!new[]
        {
            "approved",
            "rejected",
            "requires_more_info"
        }.Contains(status))
            throw ApiException.BadRequest("Invalid application status");
    }
}
