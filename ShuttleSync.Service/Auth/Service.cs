using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Auth;
public sealed class Service(MongoContext db, TokenService tokens, IRealtime realtime, IConfiguration config)
{
    public async Task<ClaimsPrincipal?> ValidateAccessTokenAsync(string token, CancellationToken ct = default)
    {
        var principal = tokens.Read(token);
        if (principal is null)
            return null;
        var id = principal.FindFirstValue("userId") ?? principal.FindFirstValue("id");
        if (id is null)
            return null;
        var user = await db.Users.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (user is null)
            return null;
        if (user.Status == "banned" && user.BanInfo?.ExpiresAt < DateTime.UtcNow)
        {
            await db.Users.UpdateOneAsync(x => x.Id == id, Builders<User>.Update.Set(x => x.Status, "active").Unset(x => x.BanInfo), cancellationToken: ct);
            user.Status = "active";
        }

        if (user.Status != "active" || user.TokenVersion != (int.TryParse(principal.FindFirstValue("tokenVersion"), out var version) ? version : 0))
            return null;
        var identity = (ClaimsIdentity)principal.Identity!;
        foreach (var old in identity.FindAll("role").ToArray())
            identity.RemoveClaim(old);
        identity.AddClaim(new Claim("role", user.Role));
        return principal;
    }

    public static string Password(string? value)
    {
        if (value is null || value.Length < 6 || value.Length > 50)
            throw ApiException.BadRequest("Mật khẩu phải có từ 6 đến 50 ký tự");
        if (!Regex.IsMatch(value, @"[a-z]") || !Regex.IsMatch(value, @"[A-Z]") || !Regex.IsMatch(value, @"[0-9]"))
            throw ApiException.BadRequest("Mật khẩu phải có chữ hoa, chữ thường và chữ số");
        return value;
    }

    static string? Phone(string? phone)
    {
        if (phone is not null && !Regex.IsMatch(phone, @"^(0|\+84)\d{9}$"))
            throw ApiException.BadRequest("Số điện thoại không hợp lệ");
        return phone;
    }

    public async Task<Session> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = Guard.Email(request.Email);
        if (await db.Users.Find(x => x.Email == email).AnyAsync(ct))
            throw ApiException.Conflict("Email đã tồn tại");
        var user = new User
        {
            Email = email,
            DisplayName = Guard.Text(request.DisplayName, "DisplayName", 50, 2),
            Phone = Phone(request.Phone),
            Password = BCrypt.Net.BCrypt.HashPassword(Password(request.Password), 12)
        };
        await db.Users.InsertOneAsync(user, cancellationToken: ct);
        return await SessionAsync(user, ct);
    }

    public async Task<Session> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await db.Users.Find(x => x.Email == Guard.Email(request.Email)).FirstOrDefaultAsync(ct);
        if (user?.Password is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            throw ApiException.Unauthorized("Email hoặc mật khẩu không chính xác");
        await ActiveAsync(user, ct);
        return await SessionAsync(user, ct);
    }

    async Task ActiveAsync(User user, CancellationToken ct)
    {
        if (user.Status == "banned" && user.BanInfo?.ExpiresAt < DateTime.UtcNow)
        {
            user.Status = "active";
            await db.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.Status, "active").Unset(x => x.BanInfo), cancellationToken: ct);
        }

        if (user.Status != "active")
            throw ApiException.Unauthorized("Tài khoản đã bị khóa");
    }

    async Task<Session> SessionAsync(User user, CancellationToken ct)
    {
        await ActiveAsync(user, ct);
        var access = tokens.Create(user);
        var refresh = tokens.Create(user, true);
        var saved = await db.Users.UpdateOneAsync(x => x.Id == user.Id && x.TokenVersion == user.TokenVersion && x.Status == "active", Builders<User>.Update.PushEach(x => x.RefreshTokens, [refresh], slice: -5).Set(x => x.LastLoginAt, DateTime.UtcNow), cancellationToken: ct);
        if (saved.MatchedCount == 0)
            throw ApiException.Unauthorized();
        return new(user, access, refresh);
    }

    public async Task<Session> RefreshAsync(string token, CancellationToken ct)
    {
        var principal = tokens.Read(token, true) ?? throw ApiException.Unauthorized();
        var id = principal.FindFirstValue("userId");
        var user = await db.Users.Find(x => x.Id == id).FirstOrDefaultAsync(ct) ?? throw ApiException.Unauthorized();
        await ActiveAsync(user, ct);
        if (user.TokenVersion != (int.TryParse(principal.FindFirstValue("tokenVersion"), out var v) ? v : 0))
            throw ApiException.Unauthorized();
        var consumed = await db.Users.UpdateOneAsync(x => x.Id == id && x.RefreshTokens.Contains(token) && x.Status == "active" && x.TokenVersion == user.TokenVersion, Builders<User>.Update.Pull(x => x.RefreshTokens, token), cancellationToken: ct);
        if (consumed.ModifiedCount == 0)
        {
            await db.Users.UpdateOneAsync(x => x.Id == id, Builders<User>.Update.Set(x => x.RefreshTokens, new List<string>()), cancellationToken: ct);
            throw ApiException.Unauthorized("Phiên đăng nhập đã bị thu hồi");
        }

        return await SessionAsync(user, ct);
    }

    public Task LogoutAsync(string id, string? token, CancellationToken ct) => db.Users.UpdateOneAsync(x => x.Id == id, token is null ? Builders<User>.Update.Set(x => x.RefreshTokens, new List<string>()) : Builders<User>.Update.Pull(x => x.RefreshTokens, token), cancellationToken: ct);
    public async Task ChangePasswordAsync(string id, PasswordRequest request, CancellationToken ct)
    {
        var user = await db.Users.Find(x => x.Id == id).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
        if (user.Password is null || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
            throw ApiException.BadRequest("Mật khẩu hiện tại không chính xác");
        var result = await db.Users.UpdateOneAsync(x => x.Id == id && x.Password == user.Password, Builders<User>.Update.Set(x => x.Password, BCrypt.Net.BCrypt.HashPassword(Password(request.NewPassword), 12)).Set(x => x.RefreshTokens, new List<string>()).Inc(x => x.TokenVersion, 1), cancellationToken: ct);
        if (result.ModifiedCount == 0)
            throw ApiException.Conflict("Mật khẩu đã được thay đổi, vui lòng thử lại");
        await realtime.DisconnectAsync(id, ct);
    }

    static string Digest(string code) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code))).ToLowerInvariant();
    public async Task RequestOtpAsync(string email, CancellationToken ct)
    {
        email = Guard.Email(email);
        var user = await db.Users.Find(x => x.Email == email).FirstOrDefaultAsync(ct);
        if (user is null)
        {
            user = new User
            {
                Email = email,
                DisplayName = email.Split('@')[0],
                Password = BCrypt.Net.BCrypt.HashPassword(Convert.ToHexString(RandomNumberGenerator.GetBytes(16)), 12)
            };
            await db.Users.InsertOneAsync(user, cancellationToken: ct);
        }

        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        await db.Users.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(x => x.OtpCode, Digest(code)).Set(x => x.OtpExpires, DateTime.UtcNow.AddMinutes(5)).Set(x => x.OtpAttempts, 0), cancellationToken: ct);
        var sender = config["EMAIL_USER"];
        if (string.IsNullOrWhiteSpace(sender) || string.IsNullOrWhiteSpace(config["EMAIL_PASS"]))
            throw new ApiException(503, "Dịch vụ gửi email OTP chưa được cấu hình");
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(sender));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Mã xác thực đăng nhập ShuttleSync";
        message.Body = new TextPart("plain")
        {
            Text = $"Mã OTP của bạn: {code}. Mã có hiệu lực trong 5 phút."
        };
        using var smtp = new SmtpClient();
        await smtp.ConnectAsync("smtp.gmail.com", 465, SecureSocketOptions.SslOnConnect, ct);
        await smtp.AuthenticateAsync(sender, config["EMAIL_PASS"]!, ct);
        await smtp.SendAsync(message, ct);
        await smtp.DisconnectAsync(true, ct);
    }

    public async Task<Session> VerifyOtpAsync(string email, string? otp, CancellationToken ct)
    {
        email = Guard.Email(email);
        if (otp is null || !Regex.IsMatch(otp, @"^\d{6}$"))
            throw ApiException.BadRequest("Mã OTP không hợp lệ");
        var digest = Digest(otp);
        var user = await db.Users.FindOneAndUpdateAsync(x => x.Email == email && x.OtpCode == digest && x.OtpExpires > DateTime.UtcNow && x.OtpAttempts < 5 && x.Status == "active", Builders<User>.Update.Unset(x => x.OtpCode).Unset(x => x.OtpExpires).Set(x => x.OtpAttempts, 0), new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After }, ct);
        if (user is null)
        {
            await db.Users.UpdateOneAsync(x => x.Email == email && x.OtpCode != null && x.OtpAttempts < 5, Builders<User>.Update.Inc(x => x.OtpAttempts, 1), cancellationToken: ct);
            throw ApiException.BadRequest("Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        return await SessionAsync(user, ct);
    }
}
