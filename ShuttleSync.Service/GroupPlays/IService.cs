using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.GroupPlays;
public interface IGroupPlayService
{
    Task<object> PopulateAsync(GroupPlay group, CancellationToken ct = default, bool detail = false);
    Task<GroupPlay> GetAsync(string id, CancellationToken ct = default);
    Task<(List<object> Data, object Pagination)> SearchAsync(string? userId, GroupSearch query, CancellationToken ct = default);
    Task<GroupPlay> CreateAsync(string userId, CreateGroup request, CancellationToken ct = default);
    Task<GroupPlay> JoinAsync(string id, string userId, CancellationToken ct = default);
    Task<GroupPlay> RequestAsync(string id, string requesterId, string userId, bool accept, string? reason, CancellationToken ct = default);
    Task<GroupPlay> ActionAsync(string id, string userId, string action, CancellationToken ct = default);
}
