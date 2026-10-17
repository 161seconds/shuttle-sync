using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Admin;
public interface IAdminService
{
    Task<(object Data, object Pagination)> ListAsync(string name, string? status, string? role, string? search, string? date, int page, int limit, CancellationToken ct);
    Task<User> BanAsync(string id, string adminId, string? reason, DateTime? expiry, CancellationToken ct);
    Task<User> UnbanAsync(string id, CancellationToken ct);
    Task<object> CourtStatusAsync(string id, string? status, string adminId, CancellationToken ct);
    Task<object> ResolveAsync(string id, string adminId, string? resolution, string? status, CancellationToken ct);
    Task<object> ReviewAsync(string id, string adminId, string? status, string? notes, CancellationToken ct);
    Task<object> DashboardAsync(CancellationToken ct);
}
