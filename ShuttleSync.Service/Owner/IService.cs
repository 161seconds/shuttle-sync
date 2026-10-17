using ShuttleSync.Repository.Entities;
using System.Text.Json.Nodes;
using ShuttleSync.Service.Courts;
using BookingEntity = ShuttleSync.Repository.Entities.Booking;

namespace ShuttleSync.Service.Owner;
public interface IOwnerService
{
    Task<Venue?> VenueAsync(string ownerId, CancellationToken ct = default);
    Task<Venue> CreateVenueAsync(string ownerId, VenueRequest input, CancellationToken ct = default);
    Task<Venue> CreateVenueWithCourtsAsync(string ownerId, VenueRequest input, IReadOnlyList<CourtRequest> children, CancellationToken ct = default);
    Task<Venue> UpdateVenueAsync(string ownerId, VenueRequest input, CancellationToken ct = default);
    Task<List<Court>> CourtsAsync(string ownerId, CancellationToken ct = default);
    Task<Court> AddCourtAsync(string ownerId, CourtRequest input, CancellationToken ct = default);
    Task<Court> UpdateCourtAsync(string ownerId, string courtId, CourtRequest input, CancellationToken ct = default);
    Task<List<JsonObject>> BookingsAsync(string ownerId, CancellationToken ct = default);
    Task<OwnerScheduleResponse> ScheduleAsync(string ownerId, string? date, CancellationToken ct = default);
    Task<BookingEntity> BlockAsync(string ownerId, BlockSlotRequest input, CancellationToken ct = default);
    Task<BookingEntity> UpdateBookingAsync(string ownerId, string bookingId, OwnerBookingRequest input, CancellationToken ct = default);
    Task NotifyAsync(string ownerId, string bookingId, string message, CancellationToken ct = default);
    Task<object> StatsAsync(string ownerId, CancellationToken ct = default);
    Task<List<Expense>> ExpensesAsync(string ownerId, int? month, int? year, CancellationToken ct = default);
    Task<Expense> CreateExpenseAsync(string ownerId, ExpenseRequest input, CancellationToken ct = default);
    Task<Expense> UpdateExpenseAsync(string ownerId, string id, ExpenseRequest input, CancellationToken ct = default);
    Task DeleteExpenseAsync(string ownerId, string id, CancellationToken ct = default);
}
