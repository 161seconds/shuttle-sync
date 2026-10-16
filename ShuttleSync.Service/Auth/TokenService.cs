using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Auth;
public sealed class TokenService
{
    readonly string access, refresh;
    public TokenService(IConfiguration config)
    {
        access = config["JWT_ACCESS_SECRET"] ?? config["JWT_SECRET"] ?? "";
        refresh = config["JWT_REFRESH_SECRET"] ?? "";
        if (config["ASPNETCORE_ENVIRONMENT"] == "Production" && (access.Length < 32 || refresh.Length < 32 || access == refresh))
            throw new InvalidOperationException("Distinct JWT secrets of at least 32 characters required");
        if (access.Length == 0)
            access = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        if (refresh.Length == 0)
            refresh = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    }

    public string Create(User user, bool isRefresh = false)
    {
        var claims = new[]
        {
            new Claim("userId", user.Id),
            new Claim("role", user.Role),
            new Claim("email", user.Email),
            new Claim("status", user.Status),
            new Claim("tokenVersion", user.TokenVersion.ToString(), ClaimValueTypes.Integer32),
            new Claim("jti", Guid.NewGuid().ToString())
        };
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.Add(isRefresh ? TimeSpan.FromDays(7) : TimeSpan.FromMinutes(15)), signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(isRefresh ? refresh : access)), SecurityAlgorithms.HmacSha256)));
    }

    public ClaimsPrincipal? Read(string token, bool isRefresh = false)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler
            {
                MapInboundClaims = false
            };
            return handler.ValidateToken(token, new TokenValidationParameters { ValidateIssuer = false, ValidateAudience = false, ValidateLifetime = true, ClockSkew = TimeSpan.Zero, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(isRefresh ? refresh : access)), ValidAlgorithms = [SecurityAlgorithms.HmacSha256], RoleClaimType = "role", NameClaimType = "userId" }, out _);
        }
        catch
        {
            return null;
        }
    }
}
