using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/users")]
public sealed class UsersController(Service.Account.IAccountService account) : ApiControllerBase
{
    [Authorize, HttpGet("profile")]
    public async Task<IActionResult> Profile(CancellationToken ct) => Success(await account.ProfileAsync(UserId, false, ct));
    [Authorize, HttpPut("profile")]
    public async Task<IActionResult> Update(ShuttleSync.Service.Account.ProfileRequest request, CancellationToken ct) => Success(await account.UpdateAsync(UserId, request, ct));
    [HttpGet("public/{userId}")]
    public async Task<IActionResult> Public(string userId, CancellationToken ct) => Success(await account.PublicAsync(userId, ct));
}
