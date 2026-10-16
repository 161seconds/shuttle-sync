using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.API.Controllers;
[Authorize(Roles = "court_owner"), Route("api/v1/owner")]
public sealed class OwnerController(OwnerService owners) : ApiControllerBase
{
    [HttpGet("venue")]
    public async Task<IActionResult> Venue(CancellationToken ct) => Success(await owners.VenueAsync(UserId, ct));
    [HttpPost("venue")]
    public async Task<IActionResult> CreateVenue(VenueRequest input, CancellationToken ct) => Success(await owners.CreateVenueAsync(UserId, input, ct));
    [HttpPut("venue")]
    public async Task<IActionResult> UpdateVenue(VenueRequest input, CancellationToken ct) => Success(await owners.UpdateVenueAsync(UserId, input, ct));
    [HttpGet("courts")]
    public async Task<IActionResult> Courts(CancellationToken ct) => Success(await owners.CourtsAsync(UserId, ct));
    [HttpPost("courts")]
    public async Task<IActionResult> AddCourt(CourtRequest input, CancellationToken ct) => Success(await owners.AddCourtAsync(UserId, input, ct));
    [HttpPut("courts/{courtId}")]
    public async Task<IActionResult> UpdateCourt(string courtId, CourtRequest input, CancellationToken ct) => Success(await owners.UpdateCourtAsync(UserId, courtId, input, ct));
    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken ct) => Success(await owners.StatsAsync(UserId, ct));
    [HttpGet("schedule")]
    public async Task<IActionResult> Schedule([FromQuery] string? date, CancellationToken ct) => Success(await owners.ScheduleAsync(UserId, date, ct));
    [HttpPost("schedule/block")]
    public async Task<IActionResult> Block(BlockSlotRequest input, CancellationToken ct) => SuccessCreated(await owners.BlockAsync(UserId, input, ct));
    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings(CancellationToken ct) => Success(await owners.BookingsAsync(UserId, ct));
    [HttpPut("bookings/{id}")]
    public async Task<IActionResult> UpdateBooking(string id, OwnerBookingRequest input, CancellationToken ct) => Success(await owners.UpdateBookingAsync(UserId, id, input, ct));
    [HttpPost("bookings/{id}/notify")]
    public async Task<IActionResult> Notify(string id, BookingNotificationRequest input, CancellationToken ct)
    {
        await owners.NotifyAsync(UserId, id, input.Message, ct);
        return Success();
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> Expenses([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct) => Success(await owners.ExpensesAsync(UserId, month, year, ct));
    [HttpPost("expenses")]
    public async Task<IActionResult> CreateExpense(ExpenseRequest input, CancellationToken ct) => SuccessCreated(await owners.CreateExpenseAsync(UserId, input, ct));
    [HttpPut("expenses/{id}")]
    public async Task<IActionResult> UpdateExpense(string id, ExpenseRequest input, CancellationToken ct) => Success(await owners.UpdateExpenseAsync(UserId, id, input, ct));
    [HttpDelete("expenses/{id}")]
    public async Task<IActionResult> DeleteExpense(string id, CancellationToken ct)
    {
        await owners.DeleteExpenseAsync(UserId, id, ct);
        return Success();
    }
}
