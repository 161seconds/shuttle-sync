using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.FileProviders;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.API.Infrastructure;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.Booking;
using ShuttleSync.API.Hubs;

var envPath = new[]
{
    ".env",
    "../.env"
}.FirstOrDefault(File.Exists);
if (envPath is not null)
    DotNetEnv.Env.NoClobber().Load(envPath);
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
builder.Configuration["ASPNETCORE_ENVIRONMENT"] = builder.Environment.EnvironmentName;
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 10 * 1024 * 1024);
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    foreach (var proxy in (builder.Configuration["TRUSTED_PROXIES"] ?? "").Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
        options.KnownProxies.Add(System.Net.IPAddress.Parse(proxy));
});
if (builder.Configuration["ASPNETCORE_URLS"] is null)
    builder.WebHost.UseUrls($"http://0.0.0.0:{builder.Configuration["PORT"] ?? "5000"}");
builder.Services.AddSingleton(_ => new MongoContext(builder.Configuration["MONGO_URI"] ?? "mongodb://localhost:27017/shuttle_sync?replicaSet=rs0"));
builder.Services.AddSingleton<ShuttleSync.Service.Auth.TokenService>();
builder.Services.AddScoped<ShuttleSync.Service.Auth.IAuthService, ShuttleSync.Service.Auth.Service>();
builder.Services.AddScoped<ShuttleSync.Service.Account.IAccountService, ShuttleSync.Service.Account.Service>();
builder.Services.AddScoped<ShuttleSync.Service.Admin.IAdminService, ShuttleSync.Service.Admin.Service>();
builder.Services.AddHttpClient<ShuttleSync.Service.AiCoach.IAiCoachService, ShuttleSync.Service.AiCoach.Service>();
builder.Services.AddScoped<ShuttleSync.Service.Booking.IBookingService, ShuttleSync.Service.Booking.BookingService>();
builder.Services.AddScoped<ShuttleSync.Service.Courts.ICourtService, ShuttleSync.Service.Courts.CourtService>();
builder.Services.AddScoped<ShuttleSync.Service.Owner.IOwnerService, ShuttleSync.Service.Owner.OwnerService>();
builder.Services.AddScoped<ShuttleSync.Service.Vouchers.IVoucherService, ShuttleSync.Service.Vouchers.VoucherService>();
builder.Services.AddScoped<ShuttleSync.Service.Chat.IChatService, ShuttleSync.Service.Chat.ChatService>();
builder.Services.AddScoped<ShuttleSync.Service.Friends.IFriendService, ShuttleSync.Service.Friends.FriendService>();
builder.Services.AddScoped<ShuttleSync.Service.GroupPlays.IGroupPlayService, ShuttleSync.Service.GroupPlays.GroupPlayService>();
builder.Services.AddScoped<ShuttleSync.Service.Tournaments.ITournamentService, ShuttleSync.Service.Tournaments.TournamentService>();
builder.Services.AddScoped<ShuttleSync.Service.RealtimeSlots.IRealtimeSlotService, ShuttleSync.Service.RealtimeSlots.RealtimeSlotService>();
builder.Services.AddScoped<ShuttleSync.Service.Community.ICommunityService, ShuttleSync.Service.Community.Service>();
builder.Services.AddScoped<ShuttleSync.Service.NotificationService.INotificationService, ShuttleSync.Service.NotificationService.Service>();
builder.Services.AddSingleton<SignalRRealtime>();
builder.Services.AddSingleton<IRealtime>(sp => sp.GetRequiredService<SignalRRealtime>());
builder.Services.AddSignalR(options => options.MaximumReceiveMessageSize = 64 * 1024).AddJsonProtocol(options => options.PayloadSerializerOptions.Converters.Add(new BsonJsonConverter()));
builder.Services.AddAuthentication("Session").AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>("Session", null);
builder.Services.AddAuthorization();
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new BsonJsonConverter()));
builder.Services.Configure<ApiBehaviorOptions>(options => options.InvalidModelStateResponseFactory = context => new BadRequestObjectResult(new { success = false, message = "Dữ liệu không hợp lệ", errors = context.ModelState.Where(x => x.Value?.Errors.Count > 0).ToDictionary(x => x.Key, x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray()) }));
var origins = (builder.Configuration["ALLOWED_ORIGINS"] ?? builder.Configuration["CLIENT_URL"] ?? "http://localhost:3000").Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var path = context.Request.Path.Value ?? "";
        var sensitive = path.StartsWith("/api/v1/auth/") && new[]
        {
            "login",
            "register",
            "request-otp",
            "verify-otp"
        }.Any(path.EndsWith);
        var key = (sensitive ? "auth:" : "api:") + context.Connection.RemoteIpAddress;
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions { PermitLimit = sensitive ? 10 : builder.Configuration.GetValue("RATE_LIMIT_MAX_REQUESTS", 100), Window = TimeSpan.FromMilliseconds(builder.Configuration.GetValue("RATE_LIMIT_WINDOW_MS", 900000)), QueueLimit = 0 });
    });
    options.OnRejected = (context, ct) => new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(new { success = false, message = "Quá nhiều yêu cầu, vui lòng thử lại sau" }, ct));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => options.CustomSchemaIds(type => type.FullName!.Replace('+', '.')));
builder.Services.AddHostedService<MaintenanceWorker>();
var app = builder.Build();
app.UseForwardedHeaders();
app.Use(async (context, next) =>
{
    try
    {
        context.Response.Headers.XContentTypeOptions = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["Referrer-Policy"] = "no-referrer";
        if (context.Request.Headers.TryGetValue("Origin", out var origin) && !origins.Contains(origin.ToString(), StringComparer.Ordinal))
            throw ApiException.Forbidden("Origin không được phép");
        await next();
    }
    catch (Exception error)when (!context.Response.HasStarted)
    {
        var status = error switch
        {
            ApiException api => api.StatusCode,
            MongoWriteException { WriteError.Category: ServerErrorCategory.DuplicateKey } => 409,
            BadHttpRequestException => 400,
            _ => 500
        };
        if (status == 500)
            app.Logger.LogError(error, "Request failed: {Path}", context.Request.Path);
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new { success = false, message = status == 500 ? "Lỗi máy chủ" : status == 409 && error is not ApiException ? "Dữ liệu đã tồn tại" : error.Message, errors = (error as ApiException)?.Errors });
    }
});
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
var uploadPath = Path.GetFullPath(builder.Configuration["UPLOAD_DIR"] ?? "uploads", app.Environment.ContentRootPath);
if (Directory.Exists(uploadPath))
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(uploadPath), RequestPath = "/uploads" });
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.MapHub<RealtimeHub>("/hubs/realtime");
app.MapGet("/api/v1/health", () => Results.Ok(new { success = true, message = "ShuttleSync API is running", timestamp = DateTime.UtcNow, uptime = (DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds }));
app.MapFallback(() => Results.Json(new { success = false, message = "Không tìm thấy đường dẫn" }, statusCode: 404));
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MongoContext>();
    var hello = await db.Database.RunCommandAsync<BsonDocument>(new BsonDocument("hello", 1));
    if (!hello.Contains("setName") && hello.GetValue("msg", "") != "isdbgrid")
        throw new InvalidOperationException("MongoDB replica set or Atlas is required for booking transactions");
    await db.Users.Indexes.CreateOneAsync(new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(u => u.Email), new CreateIndexOptions { Unique = true }));
    await scope.ServiceProvider.GetRequiredService<IBookingService>().InitializeIndexesAsync();
    await scope.ServiceProvider.GetRequiredService<ShuttleSync.Service.Community.ICommunityService>().EnsureIndexesAsync();
    await SocialIndexes.EnsureIndexesAsync(db);
    _ = scope.ServiceProvider.GetRequiredService<ShuttleSync.Service.Auth.TokenService>();
}

await app.RunAsync();
public partial class Program;
