using ShuttleSync.Repository.Entities;
using System.Text.Json.Nodes;
using MongoDB.Driver;
using BookingEntity = ShuttleSync.Repository.Entities.Booking;

namespace ShuttleSync.Service.Booking;
public interface IBookingService
{
    Task InitializeIndexesAsync(CancellationToken ct = default);
    Task<T> WithCourtsAsync<T>(IEnumerable<string> ids, Func<IClientSessionHandle, CancellationToken, Task<T>> action, CancellationToken ct = default);
    Task AssertAvailableAsync(IClientSessionHandle session, string venueId, string courtId, DateTime date, string start, string end, IEnumerable<string>? excluded = null, CancellationToken ct = default);
    Task<CreatedBookingResponse> CreateAsync(string userId, CreateBookingRequest input, CancellationToken ct = default);
    Task<List<JsonObject>> MineAsync(string userId, string? status, string? startDate, string? endDate, CancellationToken ct = default);
    Task<JsonObject> PopulateAsync(BookingEntity booking, bool owner, CancellationToken ct = default);
    Task<List<BookingEntity>> ByCodeAsync(string code, string userId, CancellationToken ct = default);
    Task<BookingEntity> ByIdAsync(string id, string userId, CancellationToken ct = default);
    Task<List<CourtBookingResponse>> CourtBookingsAsync(string venueId, string? date, CancellationToken ct = default);
    Task<BookingEntity> CancelAsync(string id, string userId, string? reason, CancellationToken ct = default);
    Task<BookingEntity> ConfirmAsync(string code, PaymentTransaction payment, CancellationToken ct = default);
    Task<string> PaymentStatusAsync(string code, CancellationToken ct = default);
    Task<long> CleanupExpiredAsync(CancellationToken ct = default);
}
