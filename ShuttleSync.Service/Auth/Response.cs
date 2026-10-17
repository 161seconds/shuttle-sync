using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Auth;
public sealed record Session(User User, string AccessToken, string RefreshToken);
public sealed record AuthResponse(User User);
