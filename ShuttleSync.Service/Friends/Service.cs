using ShuttleSync.Service.Friends.Validator;
using ShuttleSync.Service.Chat;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.NotificationService;
using System.Text.RegularExpressions;

namespace ShuttleSync.Service.Friends;
public sealed class FriendService(MongoContext db, IChatService chat, IRealtime realtime, INotificationService notifications) : IFriendService
{
    public async Task<Friendship> RequestAsync(string userId, string recipientId, CancellationToken ct = default)
    {
        FriendValidator.Recipient(userId, recipientId);
        if (!await db.Users.Find(u => u.Id == recipientId).AnyAsync(ct))
            throw ApiException.NotFound("Recipient not found");
        var existing = await db.Friendships.Find(f => (f.RequesterId == userId && f.RecipientId == recipientId) || (f.RequesterId == recipientId && f.RecipientId == userId)).FirstOrDefaultAsync(ct);
        if (existing != null)
        {
            if (existing.Status == "accepted")
                throw ApiException.BadRequest("Already friends");
            if (existing.Status == "pending")
                throw ApiException.BadRequest("Request already pending");
            if (existing.RejectionCount >= 3)
                throw ApiException.BadRequest("Cannot send request anymore. Rejection limit reached.");
            var result = await db.Friendships.UpdateOneAsync(f => f.Id == existing.Id && f.Status == "rejected" && f.RejectionCount < 3, Builders<Friendship>.Update.Set(f => f.Status, "pending").Set(f => f.RequesterId, userId).Set(f => f.RecipientId, recipientId).Set(f => f.UpdatedAt, DateTime.UtcNow), cancellationToken: ct);
            if (result.MatchedCount == 0)
                throw ApiException.Conflict("Request changed");
            existing.Status = "pending";
            existing.RequesterId = userId;
            existing.RecipientId = recipientId;
        }
        else
        {
            existing = new()
            {
                RequesterId = userId,
                RecipientId = recipientId,
                PairKey = string.Join(":", new[] { userId, recipientId }.Order(StringComparer.Ordinal))
            };
            try
            {
                await db.Friendships.InsertOneAsync(existing, cancellationToken: ct);
            }
            catch (MongoWriteException ex)when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
            {
                throw ApiException.Conflict("Request already exists");
            }
        }

        var user = await db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync(ct) ?? throw ApiException.Unauthorized();
        await realtime.UserAsync(recipientId, "friend:request", new FriendRequestResponse(userId, user.DisplayName), ct);
        await notifications.CreateAsync(recipientId, "Lời mời kết bạn mới", $"{user.DisplayName} đã gửi lời mời kết bạn", ct: ct);
        return existing;
    }

    public async Task<Friendship> RespondAsync(string userId, string id, bool accept, CancellationToken ct = default)
    {
        Guard.Id(id);
        var update = Builders<Friendship>.Update.Set(f => f.Status, accept ? "accepted" : "rejected").Set(f => f.UpdatedAt, DateTime.UtcNow);
        if (!accept)
            update = update.Inc(f => f.RejectionCount, 1);
        var friend = await db.Friendships.FindOneAndUpdateAsync(f => f.Id == id && f.RecipientId == userId && f.Status == "pending", update, new() { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound("Request not found or already processed");
        if (accept)
        {
            await chat.GetOrCreateAsync(userId, friend.RequesterId, ct);
            await realtime.UserAsync(friend.RequesterId, "friend:accepted", friend, ct);
        }

        return friend;
    }

    public async Task<List<object>> ListAsync(string userId, bool pending, CancellationToken ct = default)
    {
        var found = pending ? await db.Friendships.Find(f => f.RecipientId == userId && f.Status == "pending").ToListAsync(ct) : await db.Friendships.Find(f => (f.RequesterId == userId || f.RecipientId == userId) && f.Status == "accepted").ToListAsync(ct);
        var ids = found.Select(f => f.RequesterId == userId ? f.RecipientId : f.RequesterId).ToList();
        var users = await db.Users.Find(u => ids.Contains(u.Id)).ToListAsync(ct);
        var result = new List<object>();
        foreach (var item in found)
        {
            var other = users.FirstOrDefault(u => u.Id == (item.RequesterId == userId ? item.RecipientId : item.RequesterId));
            if (other == null)
                continue;
            if (!pending)
                result.Add(ChatResponse.PublicUser(other));
            else
            {
                var document = ChatResponse.Document(item);
                document["requesterId"] = ChatResponse.PublicUser(other);
                result.Add(document);
            }
        }

        return result;
    }

    public async Task<List<object>> SearchAsync(string userId, string query, CancellationToken ct = default)
    {
        query = FriendValidator.Query(query);
        var regex = new BsonRegularExpression(Regex.Escape(query), "i");
        var f = Builders<User>.Filter;
        var users = await db.Users.Find(f.Ne(u => u.Id, userId) & (f.Regex(u => u.Email, regex) | f.Regex(u => u.DisplayName, regex))).Limit(10).ToListAsync(ct);
        var ids = users.Select(u => u.Id).ToList();
        var friends = await db.Friendships.Find(f => (f.RequesterId == userId && ids.Contains(f.RecipientId)) || (f.RecipientId == userId && ids.Contains(f.RequesterId))).ToListAsync(ct);
        return users.Select(user =>
        {
            var result = ChatResponse.Document(ChatResponse.PublicUser(user));
            var friend = friends.FirstOrDefault(f => f.RequesterId == user.Id || f.RecipientId == user.Id);
            result["friendship"] = friend == null ? null : new FriendshipResponse(friend.Status, friend.RejectionCount, friend.RequesterId == userId);
            return (object)result;
        }).ToList();
    }
}
