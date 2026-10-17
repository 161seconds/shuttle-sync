using ShuttleSync.Repository.Entities;
using System.Text.Json.Nodes;

namespace ShuttleSync.Service.Courts;
public interface ICourtService
{
    Task<JsonObject> FormatAsync(Venue venue, IReadOnlyList<Court> courts, CancellationToken ct = default);
    Task<object> GetAsync(string id, CancellationToken ct = default);
    Task<(object Data, object Pagination)> SearchAsync(CourtSearchRequest input, bool activeOnly = false, CancellationToken ct = default);
    Task<List<string>> DistrictsAsync(CancellationToken ct = default);
    Task<List<Court>> MineAsync(string ownerId, CancellationToken ct = default);
    Task<Court> UpdateAsync(string ownerId, string courtId, CourtRequest input, bool admin = false, CancellationToken ct = default);
    Task<object> CreateAsync(string ownerId, CreateCourtRequest input, CancellationToken ct = default);
    Task<object> SlotsAsync(string venueId, string courtId, string date, CancellationToken ct = default);
}
