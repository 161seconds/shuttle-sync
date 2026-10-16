using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Test;
public sealed class IntegrationTests : IAsyncLifetime
{
    readonly string testName = "shuttle_csharp_test_" + Guid.NewGuid().ToString("N");
    MongoContext db = null!;
    WebApplicationFactory<global::Program> factory = null!;
    IServiceScope scope = null!;
    HttpClient client = null!;

    public async Task InitializeAsync()
    {
        var uri = Environment.GetEnvironmentVariable("MONGO_TEST_URI");
        if (string.IsNullOrEmpty(uri))
            throw new InvalidOperationException("Set MONGO_TEST_URI to a MongoDB test replica set; tests never use application data");
        var url = new MongoUrlBuilder(uri)
        {
            DatabaseName = testName
        };
        var settings = new Dictionary<string, string?>
        {
            ["MONGO_URI"] = url.ToString(),
            ["JWT_ACCESS_SECRET"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)),
            ["JWT_REFRESH_SECRET"] = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)),
            ["ALLOWED_ORIGINS"] = "http://localhost:5173",
            ["SEPAY_ACCOUNT_NUMBER"] = "CHECK-ACCOUNT",
            ["SEPAY_WEBHOOK_SECRET"] = "check-webhook-secret",
            ["SEPAY_API_TOKEN"] = "check-webhook-token"
        };
        factory = new WebApplicationFactory<global::Program>().WithWebHostBuilder(host =>
        {
            host.UseEnvironment("Development");
            host.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(settings));
        });
        db = new MongoContext(url.ToString());
        try
        {
            await LegacyTests.PrepareAsync(db);
            client = factory.CreateClient();
            scope = factory.Services.CreateScope();
        }
        catch
        {
            await DisposeAsync();
            throw;
        }
    }

    [Fact] public Task LegacyMongoDataRemainsCompatible() => LegacyTests.RunAsync(db);
    [Fact] public Task RestContractsAndWebhookAuthenticationRemainCompatible() => HttpTestsAsync(client, db);
    [Fact] public Task IdentityAndAdministrationEnforcePermissions() => IdentityTests.RunAsync(db, scope.ServiceProvider);
    [Fact] public Task BookingAndPaymentTransactionsRemainConsistent() => BookingTests.RunAsync(db, scope.ServiceProvider);
    [Fact] public Task SocialFeaturesEnforceMembershipAndCapacity() => SocialTests.RunAsync(db, scope.ServiceProvider);
    [Fact] public Task SignalRAuthenticatesAndDeliversMessages() => RealtimeTests.RunAsync(factory, db);

    public async Task DisposeAsync()
    {
        scope?.Dispose();
        client?.Dispose();
        if (factory is not null) await factory.DisposeAsync();
        if (db is not null) await db.Client.DropDatabaseAsync(testName);
    }

    static async Task HttpTestsAsync(HttpClient client, MongoContext db)
    {
        var swagger = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.True(swagger.IsSuccessStatusCode, "Swagger JSON renders all models");
        var doc = JsonDocument.Parse(await swagger.Content.ReadAsStringAsync());
        var actual = doc.RootElement.GetProperty("paths").EnumerateObject().SelectMany(path => path.Value.EnumerateObject().Select(method => method.Name.ToUpperInvariant() + " " + Regex.Replace(path.Name, @"\{[^}]+\}", "{}"))).ToHashSet();
        using var fixture = new StreamReader(Assembly.GetExecutingAssembly().GetManifestResourceStream("ShuttleSync.Test.Routes.txt")!);
        foreach (var expected in (await fixture.ReadToEndAsync()).Split('\n', StringSplitOptions.RemoveEmptyEntries))
            Assert.True(actual.Contains(expected.Trim()), "REST compatibility: " + expected.Trim());
        var denied = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        denied.Headers.Add("Origin", "https://untrusted.example");
        Assert.True((await client.SendAsync(denied)).StatusCode == HttpStatusCode.Forbidden, "untrusted CORS origin rejected");
        Assert.True((await client.GetAsync("/api/v1/auth/profile")).StatusCode == HttpStatusCode.Unauthorized, "anonymous profile rejected");
        Assert.True((await client.GetAsync("/api/v1/owner/venue")).StatusCode == HttpStatusCode.Unauthorized, "anonymous owner endpoint rejected");
        var registration = await client.PostAsJsonAsync("/api/v1/auth/register", new { email = "http@example.test", password = "Password123", displayName = "HTTP Player", role = "admin" });
        Assert.True(registration.StatusCode == HttpStatusCode.Created, "HTTP register sets cookie session");
        var body = await registration.Content.ReadAsStringAsync();
        var user = JsonDocument.Parse(body).RootElement.GetProperty("data").GetProperty("user");
        Assert.True(user.GetProperty("role").GetString() == "user" && ObjectId.TryParse(user.GetProperty("_id").GetString(), out _), "HTTP user role allowlist and ObjectId contract");
        Assert.True(!body.Contains("password", StringComparison.OrdinalIgnoreCase) && !body.Contains("refreshTokens") && !body.Contains("tokenVersion"), "HTTP user excludes secrets");
        Assert.True((await client.GetAsync("/api/v1/auth/profile")).IsSuccessStatusCode, "HTTP auth accepts HttpOnly cookies");
        Assert.True((await client.GetAsync("/api/v1/admin/dashboard")).StatusCode == HttpStatusCode.Forbidden, "user cannot call admin");
        Assert.True((await client.PostAsJsonAsync("/api/v1/reviews", new { courtId = "bad", bookingId = "bad", rating = 6 })).StatusCode == HttpStatusCode.BadRequest, "HTTP invalid ObjectId returns envelope400");
        var refresh = await client.PostAsJsonAsync("/api/v1/auth/refresh-token", new { });
        Assert.True(refresh.IsSuccessStatusCode, "HTTP refresh rotates cookie without body token");
        var profile = await client.GetFromJsonAsync<JsonElement>("/api/v1/auth/profile");
        var id = profile.GetProperty("data").GetProperty("_id").GetString()!;
        var notification = new Notification
        {
            UserId = id,
            Title = "Test",
            Message = "Message",
            Data = new BsonDocument
            {
                {
                    "ref",
                    ObjectId.GenerateNewId()
                },
                {
                    "date",
                    DateTime.UtcNow
                }
            }
        };
        await db.Notifications.InsertOneAsync(notification);
        var notifications = await client.GetStringAsync("/api/v1/notifications");
        Assert.True(notifications.Contains(notification.Id) && !notifications.Contains("$oid") && !notifications.Contains("$date"), "BSON notification payload uses plain IDs and ISO dates");
        var negotiate = await client.PostAsync("/hubs/realtime/negotiate?negotiateVersion=1", null);
        Assert.True(negotiate.IsSuccessStatusCode && (await negotiate.Content.ReadAsStringAsync()).Contains("connectionToken"), "SignalR native negotiation succeeds");
        await WebhookTestsAsync(client);
        Assert.True((await client.PostAsJsonAsync("/api/v1/auth/logout", new { })).IsSuccessStatusCode, "HTTP logout clears session cookies");
        Assert.True((await client.GetAsync("/api/v1/auth/profile")).StatusCode == HttpStatusCode.Unauthorized, "HTTP logout removes cookie authorization");
    }

    static async Task WebhookTestsAsync(HttpClient client)
    {
        const string raw = "{\"accountNumber\":\"CHECK-ACCOUNT\",\"content\":\"unrelated\",\"referenceCode\":\"HTTP-CHECK\",\"transferType\":\"in\",\"transferAmount\":1000}";
        var signature = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes("check-webhook-secret"), Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
        HttpRequestMessage Request(bool sign, bool token, string data = raw)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/payment/sepay-webhook")
            {
                Content = new StringContent(data, Encoding.UTF8, "application/json")
            };
            if (sign)
                req.Headers.Add("x-sepay-signature", signature);
            if (token)
                req.Headers.Add("Authorization", "Apikey check-webhook-token");
            return req;
        }

        Assert.True((await client.SendAsync(Request(false, false))).StatusCode == HttpStatusCode.Unauthorized, "webhook rejects missing credentials");
        Assert.True((await client.SendAsync(Request(true, false))).StatusCode == HttpStatusCode.Unauthorized, "webhook requires every configured credential");
        Assert.True((await client.SendAsync(Request(true, true))).IsSuccessStatusCode, "webhook accepts exact signed raw body plus token");
        Assert.True((await client.SendAsync(Request(true, true, raw + " "))).StatusCode == HttpStatusCode.Unauthorized, "webhook signature rejects body tampering");
    }
}
