using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Auth;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Test;
public static class IdentityTests
{
    public static async Task RunAsync(MongoContext db, IServiceProvider services)
    {
        var ct = CancellationToken.None;
        var auth = services.GetRequiredService<ShuttleSync.Service.Auth.Service>();
        var admin = services.GetRequiredService<ShuttleSync.Service.Admin.Service>();
        var community = services.GetRequiredService<ShuttleSync.Service.Community.Service>();
        await community.EnsureIndexesAsync(ct);
        var email = $"identity-{Guid.NewGuid():N}@example.test";
        var account = services.GetRequiredService<ShuttleSync.Service.Account.Service>();
        foreach (var invalidProfile in new[] { "{\"displayName\":42}", "{\"phone\":false}", "{\"avatar\":{}}", "{\"sportPreferences\":null}", "{\"sportPreferences\":[42]}", "{\"settings\":null}", "{\"settings\":{\"notifications\":\"true\"}}", "{\"settings\":{\"language\":7}}" })
        {
            using var invalid = System.Text.Json.JsonDocument.Parse(invalidProfile);
            await TestAssert.ThrowsAsync<ApiException>(() => account.UpdateAsync(MongoDB.Bson.ObjectId.GenerateNewId().ToString(), invalid.RootElement, ct), "malformed profile JSON rejects before Mongo write");
        }
        var registered = await auth.RegisterAsync(new RegisterRequest(email, "Password123", "Test Player"), ct);
        Assert.True(registered.User.Role == "user" && BCrypt.Net.BCrypt.Verify("Password123", registered.User.Password), "registration stores bcrypt and user role");
        Assert.True(await auth.ValidateAccessTokenAsync(registered.AccessToken, ct) != null, "issued JWT validates current Mongo user");
        await TestAssert.ThrowsAsync<ApiException>(() => auth.LoginAsync(new LoginRequest(email, "wrong"), ct), "wrong password rejected");
        var logged = await auth.LoginAsync(new LoginRequest(email, "Password123"), ct);
        Assert.True(await auth.ValidateAccessTokenAsync(logged.AccessToken, ct) != null, "bcrypt account login remains compatible");
        var rotated = await auth.RefreshAsync(logged.RefreshToken, ct);
        Assert.True(rotated.RefreshToken != logged.RefreshToken, "refresh token rotates even in same second");
        await TestAssert.ThrowsAsync<ApiException>(() => auth.RefreshAsync(logged.RefreshToken, ct), "refresh replay rejected");
        await TestAssert.ThrowsAsync<ApiException>(() => auth.RefreshAsync(rotated.RefreshToken, ct), "replay revokes remaining refresh sessions");
        await auth.ChangePasswordAsync(registered.User.Id, new PasswordRequest("Password123", "NewPassword456"), ct);
        Assert.True(await auth.ValidateAccessTokenAsync(registered.AccessToken, ct) == null, "password change revokes prior access token");
        logged = await auth.LoginAsync(new LoginRequest(email, "NewPassword456"), ct);
        var administrator = new User
        {
            Email = $"admin-{Guid.NewGuid():N}@example.test",
            DisplayName = "Admin",
            Role = "admin"
        };
        await db.Users.InsertOneAsync(administrator, cancellationToken: ct);
        await admin.BanAsync(registered.User.Id, administrator.Id, "Test ban", null, ct);
        Assert.True(await auth.ValidateAccessTokenAsync(logged.AccessToken, ct) == null, "ban revokes access immediately");
        await admin.UnbanAsync(registered.User.Id, ct);
        Assert.True(await auth.ValidateAccessTokenAsync(logged.AccessToken, ct) == null, "unban does not resurrect revoked JWT");
        const string otp = "123456";
        var digest = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(otp))).ToLowerInvariant();
        await db.Users.UpdateOneAsync(x => x.Id == registered.User.Id, Builders<User>.Update.Set(x => x.OtpCode, digest).Set(x => x.OtpExpires, DateTime.UtcNow.AddMinutes(5)).Set(x => x.OtpAttempts, 0), cancellationToken: ct);
        for (var i = 0; i < 5; i++)
            await TestAssert.ThrowsAsync<ApiException>(() => auth.VerifyOtpAsync(email, "000000", ct), "wrong OTP increments bounded attempt count");
        await TestAssert.ThrowsAsync<ApiException>(() => auth.VerifyOtpAsync(email, otp, ct), "correct OTP rejected after five wrong attempts");
        await db.Users.UpdateOneAsync(x => x.Id == registered.User.Id, Builders<User>.Update.Set(x => x.OtpCode, digest).Set(x => x.OtpExpires, DateTime.UtcNow.AddMinutes(5)).Set(x => x.OtpAttempts, 0), cancellationToken: ct);
        var otpSession = await auth.VerifyOtpAsync(email, otp, ct);
        Assert.True(await auth.ValidateAccessTokenAsync(otpSession.AccessToken, ct) != null, "hashed OTP login issues valid session");
        await TestAssert.ThrowsAsync<ApiException>(() => auth.VerifyOtpAsync(email, otp, ct), "consumed OTP cannot replay");
        var applicant = new User
        {
            Email = $"applicant-{Guid.NewGuid():N}@example.test",
            DisplayName = "Owner"
        };
        await db.Users.InsertOneAsync(applicant, cancellationToken: ct);
        var application = await community.ApplyAsync(applicant.Id, new OwnerApplication { CourtName = "Identity Court", CourtAddress = new() { Street = "Street", Ward = "Ward", District = "District", FullAddress = "Full address" }, CourtLocation = new() { Lat = 10, Lng = 106 }, SportTypes = ["badminton"], IdentityDocument = "identity.pdf" }, ct);
        await TestAssert.ThrowsAsync<ApiException>(() => community.ApplyAsync(applicant.Id, new OwnerApplication { CourtName = "Other Court", CourtAddress = application.CourtAddress, CourtLocation = application.CourtLocation, SportTypes = ["badminton"], IdentityDocument = "id" }, ct), "duplicate pending owner application rejected");
        await admin.ReviewAsync(application.Id, administrator.Id, "approved", null, ct);
        await admin.ReviewAsync(application.Id, administrator.Id, "approved", null, ct);
        Assert.True(await db.Collection<Venue>("venues").CountDocumentsAsync(x => x.OwnerId == applicant.Id, cancellationToken: ct) == 1, "approval idempotently creates one venue");
        Assert.True((await db.Users.Find(x => x.Id == applicant.Id).FirstAsync(ct)).Role == "court_owner", "approval grants current owner role");
        var venue = await db.Collection<Venue>("venues").Find(x => x.OwnerId == applicant.Id).FirstAsync(ct);
        var booking = new Booking
        {
            UserId = registered.User.Id,
            CourtId = venue.Id,
            SubCourtId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            Status = "completed",
            FinalAmount = 250000,
            Payment = new BookingPayment { Status = "paid" },
            BookingCode = "CHECK-" + Guid.NewGuid().ToString("N")
        };
        await db.Collection<Booking>("bookings").InsertOneAsync(booking, cancellationToken: ct);
        await TestAssert.ThrowsAsync<ApiException>(() => community.ReviewAsync(applicant.Id, new Review { CourtId = venue.Id, BookingId = booking.Id, Rating = 5 }, ct), "review rejects another user's booking");
        await community.ReviewAsync(registered.User.Id, new Review { CourtId = venue.Id, BookingId = booking.Id, Rating = 4 }, ct);
        await TestAssert.ThrowsAsync<MongoWriteException>(() => community.ReviewAsync(registered.User.Id, new Review { CourtId = venue.Id, BookingId = booking.Id, Rating = 5 }, ct), "duplicate booking review rejected by unique index");
        venue = await db.Collection<Venue>("venues").Find(x => x.Id == venue.Id).FirstAsync(ct);
        Assert.True(venue.Rating.TotalScore == 4 && venue.Rating.ReviewsCount == 1, "review rating totals update once atomically");
        var dashboard = System.Text.Json.JsonSerializer.SerializeToElement(await admin.DashboardAsync(ct));
        var expectedCourts = await db.Collection<Venue>("venues").CountDocumentsAsync(x => x.IsActive, cancellationToken: ct);
        var expectedBookings = await db.Collection<Booking>("bookings").Find(x => x.Status == "confirmed" || x.Status == "completed").ToListAsync(ct);
        Assert.True(dashboard.GetProperty("totalCourts").GetInt64() == expectedCourts, "admin dashboard counts active venues");
        Assert.True(dashboard.GetProperty("totalBookings").GetInt32() == expectedBookings.Count && dashboard.GetProperty("totalRevenue").GetDouble() == expectedBookings.Sum(x => x.FinalAmount), "admin dashboard retains completed booking revenue");
        var report = await community.ReportAsync(registered.User.Id, new Report { TargetCourtId = venue.Id, Description = "Report venue fixture", Reason = "other" }, ct);
        var reports = await admin.ListAsync("reports", null, null, null, null, 1, 100, ct);
        var reportItems = System.Text.Json.JsonSerializer.SerializeToElement(reports.Data).EnumerateArray();
        var populatedReport = reportItems.Single(x => x.GetProperty("_id").GetString() == report.Id);
        Assert.True(populatedReport.GetProperty("targetCourtId").GetProperty("name").GetString() == venue.Name, "admin report court population resolves venue collection");
    }
}
