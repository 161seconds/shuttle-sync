using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Community;
public interface ICommunityService
{
    Task EnsureIndexesAsync(CancellationToken ct = default);
    Task<Review> ReviewAsync(string userId, ReviewRequest request, CancellationToken ct);
    Task<(object Data, object Pagination)> ReviewsAsync(string courtId, int page, int limit, CancellationToken ct);
    Task<Review> ReplyAsync(string id, string ownerId, string? comment, CancellationToken ct);
    Task<OwnerApplication> ApplyAsync(string userId, OwnerApplicationRequest request, CancellationToken ct);
    Task<List<OwnerApplication>> ApplicationsAsync(string userId, CancellationToken ct);
    Task<Report> ReportAsync(string userId, ReportRequest request, CancellationToken ct);
    Task<Event> EventAsync(string userId, EventRequest request, CancellationToken ct);
    Task<(object Data, object Pagination)> EventsAsync(string? type, int page, int limit, CancellationToken ct);
    Task<object> GetEventAsync(string id, CancellationToken ct);
    Task<EventVoucherResponse> ValidateVoucherAsync(string? code, double amount, string? courtId, CancellationToken ct);
}
