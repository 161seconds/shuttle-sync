using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Auth;
using AuthService = ShuttleSync.Service.Auth.Service;
using AccountService = ShuttleSync.Service.Account.Service;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/auth")]
public sealed class AuthController(AuthService auth, AccountService account, IWebHostEnvironment env) : ApiControllerBase
{
    void Cookies(Session session)
    {
        var options = new CookieOptions
        {
            HttpOnly = true,
            Secure = env.IsProduction(),
            SameSite = env.IsProduction() ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        };
        options.MaxAge = TimeSpan.FromMinutes(15);
        Response.Cookies.Append("accessToken", session.AccessToken, options);
        options.MaxAge = TimeSpan.FromDays(7);
        Response.Cookies.Append("refreshToken", session.RefreshToken, options);
    }

    void Clear()
    {
        var options = new CookieOptions
        {
            HttpOnly = true,
            Secure = env.IsProduction(),
            SameSite = env.IsProduction() ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        };
        Response.Cookies.Delete("accessToken", options);
        Response.Cookies.Delete("refreshToken", options);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var session = await auth.RegisterAsync(request, ct);
        Cookies(session);
        return SuccessCreated(new { user = session.User }, "Đăng ký thành công");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var session = await auth.LoginAsync(request, ct);
        Cookies(session);
        return Success(new { user = session.User }, "Đăng nhập thành công");
    }

    [HttpPost("request-otp")]
    public async Task<IActionResult> RequestOtp(OtpRequest request, CancellationToken ct)
    {
        await auth.RequestOtpAsync(request.Email, ct);
        return Success(null, "Đã gửi mã OTP đến email của bạn!");
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> Verify(OtpRequest request, CancellationToken ct)
    {
        var session = await auth.VerifyOtpAsync(request.Email, request.Otp, ct);
        Cookies(session);
        return Success(new { user = session.User }, "Đăng nhập thành công");
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken ct)
    {
        try
        {
            var token = Request.Cookies["refreshToken"] ?? request.RefreshToken ?? throw Service.Exceptions.ApiException.Unauthorized();
            var session = await auth.RefreshAsync(token, ct);
            Cookies(session);
            return Success(null, "Làm mới phiên đăng nhập thành công");
        }
        catch
        {
            Clear();
            throw;
        }
    }

    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct)
    {
        await auth.LogoutAsync(UserId, Request.Cookies["refreshToken"] ?? request.RefreshToken, ct);
        Clear();
        return Success(null, "Đăng xuất thành công");
    }

    [Authorize, HttpGet("profile")]
    public async Task<IActionResult> Profile(CancellationToken ct) => Success(await account.ProfileAsync(UserId, true, ct));
    [Authorize, HttpPut("profile")]
    public async Task<IActionResult> Update(System.Text.Json.JsonElement request, CancellationToken ct) => Success(await account.UpdateAsync(UserId, request, ct));
    [Authorize, HttpPut("change-password")]
    public async Task<IActionResult> Password(PasswordRequest request, CancellationToken ct)
    {
        await auth.ChangePasswordAsync(UserId, request, ct);
        Clear();
        return Success(null, "Đổi mật khẩu thành công");
    }
}
