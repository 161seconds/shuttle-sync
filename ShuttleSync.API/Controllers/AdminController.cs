using ShuttleSync.Service.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ShuttleSync.API.Controllers;
[Authorize(Roles = "admin"), Route("api/v1/admin")]
public sealed class AdminController(Service.Admin.IAdminService service) : ApiControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct) => Success(await service.DashboardAsync(ct));
    [HttpGet("users")]
    public Task<IActionResult> Users(string? role, string? status, string? search, int page = 1, int limit = 20, CancellationToken ct = default) => List("users", status, role, search, null, page, limit, ct);
    [HttpGet("courts")]
    public Task<IActionResult> Courts(string? status, int page = 1, int limit = 20, CancellationToken ct = default) => List("courts", status, null, null, null, page, limit, ct);
    [HttpGet("bookings")]
    public Task<IActionResult> Bookings(string? status, string? date, int page = 1, int limit = 20, CancellationToken ct = default) => List("bookings", status, null, null, date, page, limit, ct);
    [HttpGet("applications")]
    public Task<IActionResult> Applications(string? status, int page = 1, int limit = 20, CancellationToken ct = default) => List("ownerapplications", status, null, null, null, page, limit, ct);
    [HttpGet("reports")]
    public Task<IActionResult> Reports(string? status, int page = 1, int limit = 20, CancellationToken ct = default) => List("reports", status, null, null, null, page, limit, ct);
    async Task<IActionResult> List(string name, string? status, string? role, string? search, string? date, int page, int limit, CancellationToken ct)
    {
        var result = await service.ListAsync(name, status, role, search, date, page, limit, ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [HttpPost("users/{userId}/ban")]
    public async Task<IActionResult> Ban(string userId, BanRequest request, CancellationToken ct) => Success(await service.BanAsync(userId, UserId, request.Reason, request.ExpiresAt, ct));
    [HttpPost("users/{userId}/unban")]
    public async Task<IActionResult> Unban(string userId, CancellationToken ct) => Success(await service.UnbanAsync(userId, ct));
    [HttpPut("courts/{courtId}/status")]
    public async Task<IActionResult> CourtStatus(string courtId, StatusRequest request, CancellationToken ct) => Success(await service.CourtStatusAsync(courtId, request.Status, UserId, ct));
    [HttpPut("applications/{applicationId}")]
    public async Task<IActionResult> Review(string applicationId, ReviewRequest request, CancellationToken ct) => Success(await service.ReviewAsync(applicationId, UserId, request.Status, request.ReviewNotes, ct));
    [HttpPut("reports/{reportId}")]
    public async Task<IActionResult> Resolve(string reportId, ResolveRequest request, CancellationToken ct) => Success(await service.ResolveAsync(reportId, UserId, request.Resolution, request.Status, ct));
}
