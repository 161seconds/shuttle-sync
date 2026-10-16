using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.API.Controllers;
[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected string UserId => User.FindFirstValue("userId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw ApiException.Unauthorized();
    protected string Role => User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "user";

    protected IActionResult Success(object? data = null, string message = "Thành công", object? pagination = null) => pagination is null ? Ok(new { success = true, message, data }) : Ok(new { success = true, message, data, pagination });
    protected IActionResult SuccessCreated(object? data = null, string message = "Tạo thành công") => StatusCode(201, new { success = true, message, data });
}
