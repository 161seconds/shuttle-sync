using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace ShuttleSync.API.Infrastructure;
public sealed class SessionAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, Service.Auth.IAuthService auth) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var token = Request.Cookies["accessToken"];
        if (string.IsNullOrEmpty(token) && Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            token = Request.Headers.Authorization.ToString()[7..];
        if (string.IsNullOrEmpty(token))
            return AuthenticateResult.NoResult();
        var principal = await auth.ValidateAccessTokenAsync(token, Context.RequestAborted);
        return principal is null ? AuthenticateResult.Fail("Invalid or expired session") : AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties) => Error(401, "Vui lòng đăng nhập");
    protected override Task HandleForbiddenAsync(AuthenticationProperties properties) => Error(403, "Bạn không có quyền truy cập");
    Task Error(int status, string message)
    {
        Response.StatusCode = status;
        return Response.WriteAsJsonAsync(new { success = false, message });
    }
}
