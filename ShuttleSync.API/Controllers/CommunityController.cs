using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Community;

namespace ShuttleSync.API.Controllers;
public sealed class CommunityController(Service.Community.ICommunityService service) : ApiControllerBase
{
    [Authorize, HttpPost("api/v1/reviews")]
    public async Task<IActionResult> Review(ReviewRequest request, CancellationToken ct) => SuccessCreated(await service.ReviewAsync(UserId, request, ct));
    [HttpGet("api/v1/reviews/court/{courtId}")]
    public async Task<IActionResult> Reviews(string courtId, int page = 1, int limit = 20, CancellationToken ct = default)
    {
        var result = await service.ReviewsAsync(courtId, page, limit, ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [Authorize(Roles = "court_owner,admin"), HttpPost("api/v1/reviews/{reviewId}/reply")]
    public async Task<IActionResult> Reply(string reviewId, ReplyRequest request, CancellationToken ct) => Success(await service.ReplyAsync(reviewId, UserId, request.Comment, ct));
    [Authorize, HttpPost("api/v1/owner-applications")]
    public async Task<IActionResult> Apply(OwnerApplicationRequest request, CancellationToken ct) => SuccessCreated(await service.ApplyAsync(UserId, request, ct));
    [Authorize, HttpGet("api/v1/owner-applications/my")]
    public async Task<IActionResult> Applications(CancellationToken ct) => Success(await service.ApplicationsAsync(UserId, ct));
    [Authorize, HttpPost("api/v1/reports")]
    public async Task<IActionResult> Report(ReportRequest request, CancellationToken ct) => SuccessCreated(await service.ReportAsync(UserId, request, ct));
    [HttpGet("api/v1/events")]
    public async Task<IActionResult> Events(string? type, int page = 1, int limit = 20, CancellationToken ct = default)
    {
        var result = await service.EventsAsync(type, page, limit, ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [HttpGet("api/v1/events/{id}")]
    public async Task<IActionResult> Event(string id, CancellationToken ct) => Success(await service.GetEventAsync(id, ct));
    [Authorize, HttpPost("api/v1/events")]
    public async Task<IActionResult> CreateEvent(EventRequest request, CancellationToken ct) => SuccessCreated(await service.EventAsync(UserId, request, ct));
    [HttpPost("api/v1/events/validate-voucher")]
    public async Task<IActionResult> ValidateVoucher(EventVoucherRequest request, CancellationToken ct) => Success(await service.ValidateVoucherAsync(request.Code, request.BookingAmount, request.CourtId, ct));
}
