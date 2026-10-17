using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Tournaments;
public interface ITournamentService
{
    Task<Tournament> GetAsync(string id, CancellationToken ct = default);
    Task<List<Tournament>> MyAsync(string userId, CancellationToken ct = default);
    Task<Tournament> QuickAsync(string userId, string? title, CancellationToken ct = default);
    Task<Tournament> StartAsync(string id, string userId, CancellationToken ct = default);
    Task<Tournament> UpdateAsync(string id, string matchId, string userId, MatchRequest input, CancellationToken ct = default);
}
