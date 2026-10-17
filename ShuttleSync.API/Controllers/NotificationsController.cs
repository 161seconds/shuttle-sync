using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Notifications = ShuttleSync.Service.NotificationService;

namespace ShuttleSync.API.Controllers;
[Authorize, Route("api/v1/notifications")]
public sealed class NotificationsController(Notifications.INotificationService service) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(bool unreadOnly = false, int page = 1, int limit = 20, CancellationToken ct = default)
    {
        var result = await service.GetAsync(UserId, new(unreadOnly, page, limit), ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> Read(string id, CancellationToken ct)
    {
        await service.ReadAsync(id, UserId, ct);
        return Success();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> ReadAll(CancellationToken ct)
    {
        await service.ReadAllAsync(UserId, ct);
        return Success();
    }
}
