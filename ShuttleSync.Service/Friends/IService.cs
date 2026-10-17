using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Friends;
public interface IFriendService
{
    Task<Friendship> RequestAsync(string userId, string recipientId, CancellationToken ct = default);
    Task<Friendship> RespondAsync(string userId, string id, bool accept, CancellationToken ct = default);
    Task<List<object>> ListAsync(string userId, bool pending, CancellationToken ct = default);
    Task<List<object>> SearchAsync(string userId, string query, CancellationToken ct = default);
}
