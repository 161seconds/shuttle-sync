using ShuttleSync.Service.Chat;
using ShuttleSync.Service.RealtimeSlots;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using ShuttleSync.Service.Common;
using AuthService = ShuttleSync.Service.Auth.IAuthService;

namespace ShuttleSync.API.Hubs;
public sealed class SignalRRealtime(IHubContext<RealtimeHub> hub) : IRealtime
{
    readonly ConcurrentDictionary<string, (string UserId, HubCallerContext Context)> connections = new();
    public void Register(string id, string userId, HubCallerContext context) => connections[id] = (userId, context);
    public void Remove(string id) => connections.TryRemove(id, out _);
    public bool HasConnections(string userId) => connections.Values.Any(c => c.UserId == userId);
    public Task UserAsync(string userId, string eventName, object payload, CancellationToken ct = default) => RoomAsync($"user:{userId}", eventName, payload, ct);
    public Task RoomAsync(string room, string eventName, object payload, CancellationToken ct = default) => hub.Clients.Group(room).SendAsync("event", eventName, payload, ct);
    public async Task DisconnectAsync(string userId, CancellationToken ct = default)
    {
        foreach (var item in connections.Where(c => c.Value.UserId == userId))
        {
            await hub.Clients.Client(item.Key).SendAsync("session_expired", cancellationToken: ct);
            item.Value.Context.Abort();
        }
    }
}

public sealed class RealtimeHub(AuthService auth, IChatService chat, IRealtimeSlotService slots, SignalRRealtime realtime) : Hub
{
    string? Token => Context.GetHttpContext()?.Request.Cookies["accessToken"] ?? Context.GetHttpContext()?.Request.Headers.Authorization.ToString().Replace("Bearer ", "");

    async Task<string?> SessionAsync(bool required)
    {
        var principal = string.IsNullOrEmpty(Token) ? null : await auth.ValidateAccessTokenAsync(Token, Context.ConnectionAborted);
        var id = principal?.FindFirstValue("userId") ?? principal?.FindFirstValue("id") ?? principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == null && required)
        {
            await Clients.Caller.SendAsync("session_expired");
            Context.Abort();
            throw new HubException("Authentication failed");
        }

        return id;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = await SessionAsync(!string.IsNullOrEmpty(Token));
        if (userId != null)
        {
            Context.Items["userId"] = userId;
            realtime.Register(Context.ConnectionId, userId, Context);
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
            await Clients.All.SendAsync("event", "user:online", new { userId });
        }

        await base.OnConnectedAsync();
    }

    public async Task Invoke(string eventName, JsonElement payload)
    {
        var guest = eventName is "court:join" or "court:leave";
        var userId = await SessionAsync(!guest);
        try
        {
            switch (eventName)
            {
                case "court:join":
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"court:{Guard.Id(payload.GetString())}");
                    break;
                case "court:leave":
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"court:{Guard.Id(payload.GetString())}");
                    break;
                case "group_play:join":
                    var id = Guard.Id(payload.GetString());
                    await chat.RequireGroupAsync(id, userId!, Context.ConnectionAborted);
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"group_play:{id}");
                    break;
                case "group_play:leave":
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group_play:{Guard.Id(payload.GetString())}");
                    break;
                case "chat:send":
                    await chat.SendGroupAsync(userId!, payload.Deserialize<SendChat>(new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? throw new HubException("Invalid message"), Context.ConnectionAborted);
                    break;
                case "chat:direct_message":
                    await chat.SendDirectAsync(userId!, payload.Deserialize<SendChat>(new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? throw new HubException("Invalid message"), Context.ConnectionAborted);
                    break;
                case "slot:select":
                    await SlotAsync(userId!, payload, true);
                    break;
                case "slot:deselect":
                    await SlotAsync(userId!, payload, false);
                    break;
                default:
                    throw new HubException("Unknown event");
            }
        }
        catch (ShuttleSync.Service.Exceptions.ApiException ex)
        {
            throw new HubException(ex.Message);
        }
        catch (JsonException)
        {
            throw new HubException("Invalid payload");
        }
        catch (InvalidOperationException)
        {
            throw new HubException("Invalid payload");
        }
    }

    async Task SlotAsync(string userId, JsonElement payload, bool select)
    {
        var request = payload.Deserialize<SlotRequest>(new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? throw new HubException("Invalid payload");
        await slots.SelectAsync(userId, request, select, Context.ConnectionAborted);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.Items.TryGetValue("userId", out var value) ? value as string : null;
        realtime.Remove(Context.ConnectionId);
        if (userId != null && !realtime.HasConnections(userId))
        {
            await slots.ReleaseAsync(userId);
            await Clients.All.SendAsync("event", "user:offline", new { userId });
        }

        await base.OnDisconnectedAsync(exception);
    }
}
