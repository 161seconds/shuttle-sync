using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Booking;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/bookings")]
public sealed class BookingsController(BookingService bookings) : ApiControllerBase
{
    [HttpGet("court/{courtId}")]
    public async Task<IActionResult> Court(string courtId, [FromQuery] string? date, CancellationToken ct) => Success(await bookings.CourtBookingsAsync(courtId, date, ct));
    [Authorize, HttpPost]
    public async Task<IActionResult> Create(CreateBookingRequest input, CancellationToken ct) => SuccessCreated(await bookings.CreateAsync(UserId, input, ct), "Tạo đơn đặt sân thành công");
    [Authorize, HttpGet("my")]
    public async Task<IActionResult> Mine([FromQuery] string? status, [FromQuery] string? startDate, [FromQuery] string? endDate, CancellationToken ct) => Success(await bookings.MineAsync(UserId, status, startDate, endDate, ct));
    [Authorize, HttpGet("code/{code}")]
    public async Task<IActionResult> ByCode(string code, CancellationToken ct)
    {
        var rows = await bookings.ByCodeAsync(code, UserId, ct);
        return Success(await Task.WhenAll(rows.Select(row => bookings.PopulateAsync(row, false, ct))));
    }

    [Authorize, HttpGet("{bookingId}")]
    public async Task<IActionResult> ById(string bookingId, CancellationToken ct) => Success(await bookings.PopulateAsync(await bookings.ByIdAsync(bookingId, UserId, ct), false, ct));
    [Authorize, HttpPost("{bookingId}/confirm-payment")]
    public IActionResult Confirm(string bookingId) => throw ApiException.Forbidden("Thanh toán chỉ được xác nhận từ giao dịch đã xác minh");
    [Authorize, HttpPost("{bookingId}/cancel")]
    public async Task<IActionResult> Cancel(string bookingId, CancelBookingRequest input, CancellationToken ct) => Success(await bookings.CancelAsync(bookingId, UserId, input.Reason, ct));
}
