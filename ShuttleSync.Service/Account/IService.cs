using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Account;
public interface IAccountService
{
    Task<User> GetAsync(string id, CancellationToken ct);
    Task<User> ProfileAsync(string id, bool computed, CancellationToken ct);
    Task<PublicProfileResponse> PublicAsync(string id, CancellationToken ct);
    Task<User> UpdateAsync(string id, ProfileRequest input, CancellationToken ct);
}
