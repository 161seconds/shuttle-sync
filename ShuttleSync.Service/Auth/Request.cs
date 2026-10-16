namespace ShuttleSync.Service.Auth;
public sealed record RegisterRequest(string Email, string Password, string DisplayName, string? Phone = null);
public sealed record LoginRequest(string Email, string Password);
public sealed record PasswordRequest(string CurrentPassword, string NewPassword);
public sealed record OtpRequest(string Email, string? Otp = null);
public sealed record RefreshRequest(string? RefreshToken = null);
public sealed record Session(Repository.Entities.User User, string AccessToken, string RefreshToken);
