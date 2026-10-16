using System.Text.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Auth;

namespace ShuttleSync.Test;
public static class RealtimeTests
{
    public static async Task RunAsync(WebApplicationFactory<global::Program> factory, MongoContext db)
    {
        var first = new User
        {
            Email = "realtime-first@example.test",
            DisplayName = "Authenticated sender"
        };
        var second = new User
        {
            Email = "realtime-second@example.test",
            DisplayName = "Recipient"
        };
        var outsider = new User
        {
            Email = "realtime-outsider@example.test",
            DisplayName = "Outsider"
        };
        await db.Users.InsertManyAsync([first, second, outsider]);
        using var scope = factory.Services.CreateScope();
        var tokens = scope.ServiceProvider.GetRequiredService<TokenService>();
        HubConnection Connect(User? user) => new HubConnectionBuilder().WithUrl("http://localhost/hubs/realtime", options =>
        {
            options.Transports = HttpTransportType.LongPolling;
            options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
            if (user != null)
                options.Headers["Cookie"] = $"accessToken={tokens.Create(user)}";
        }).Build();
        await using var sender = Connect(first);
        await using var recipient = Connect(second);
        await using var stranger = Connect(outsider);
        await using var guest = Connect(null);
        await Task.WhenAll(sender.StartAsync(), recipient.StartAsync(), stranger.StartAsync(), guest.StartAsync());
        Assert.True(sender.State == HubConnectionState.Connected && guest.State == HubConnectionState.Connected, "SignalR authenticated and guest handshakes connect");
        var group = new GroupPlay
        {
            Title = "Realtime",
            OrganizerId = first.Id,
            CourtId = ObjectId.GenerateNewId().ToString(),
            SubCourtId = ObjectId.GenerateNewId().ToString(),
            BookingId = ObjectId.GenerateNewId().ToString(),
            MaxPlayers = 4,
            Participants = [new()
            {
                UserId = first.Id,
                DisplayName = first.DisplayName
            }, new()
            {
                UserId = second.Id,
                DisplayName = second.DisplayName
            }

            ]
        };
        await db.GroupPlays.InsertOneAsync(group);
        var received = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var subscription = recipient.On<string, JsonElement>("event", (name, data) =>
        {
            if (name == "chat:message")
                received.TrySetResult(data);
        });
        await sender.InvokeAsync("Invoke", "group_play:join", group.Id);
        await recipient.InvokeAsync("Invoke", "group_play:join", group.Id);
        await TestAssert.ThrowsAsync<HubException>(() => stranger.InvokeAsync("Invoke", "group_play:join", group.Id), "SignalR blocks outsiders from private group room");
        await sender.InvokeAsync("Invoke", "chat:send", new { groupPlayId = group.Id, content = "Integration hello", senderName = "Forged identity" });
        var message = await received.Task.WaitAsync(TimeSpan.FromSeconds(10));
        Assert.True(message.GetProperty("senderName").GetString() == first.DisplayName && message.GetProperty("senderId").GetString() == first.Id, "SignalR message persists and broadcasts authenticated sender identity");
        Assert.True(await db.ChatMessages.CountDocumentsAsync(m => m.GroupPlayId == group.Id) == 1, "SignalR writes one message to legacy Mongo collection");
        var expired = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        using var expirySubscription = sender.On("session_expired", () => expired.TrySetResult());
        await db.Users.UpdateOneAsync(u => u.Id == first.Id, Builders<User>.Update.Set(u => u.Status, "banned"));
        try
        {
            await sender.InvokeAsync("Invoke", "chat:send", new { groupPlayId = group.Id, content = "Must not persist" });
        }
        catch (Exception ex)when (ex is HubException or OperationCanceledException or IOException)
        {
        }

        await expired.Task.WaitAsync(TimeSpan.FromSeconds(10));
        Assert.True(await db.ChatMessages.CountDocumentsAsync(m => m.GroupPlayId == group.Id) == 1, "SignalR revalidates banned users before each method");
        await guest.InvokeAsync("Invoke", "court:join", group.CourtId);
        await TestAssert.ThrowsAsync<Exception>(() => guest.InvokeAsync("Invoke", "chat:send", new { groupPlayId = group.Id, content = "Guest blocked" }), "guest court viewing cannot send chat");
    }
}
