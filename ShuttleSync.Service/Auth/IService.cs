using System.Security.Claims;

namespace ShuttleSync.Service.Auth;
public interface IAuthService
{
    Task<ClaimsPrincipal?> ValidateAccessTokenAsync(string token, CancellationToken ct = default);
    Task<Session> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<Session> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<Session> RefreshAsync(string token, CancellationToken ct);
    Task LogoutAsync(string id, string? token, CancellationToken ct);
    Task ChangePasswordAsync(string id, PasswordRequest request, CancellationToken ct);
    Task RequestOtpAsync(string email, CancellationToken ct);
    Task<Session> VerifyOtpAsync(string email, string? otp, CancellationToken ct);
}
