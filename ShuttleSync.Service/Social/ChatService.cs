using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using System.Text.Json;

namespace ShuttleSync.Service.Social;
public sealed class ChatService(MongoContext db, IRealtime realtime)
{
    public static Dictionary<string, object?> Document<T>(T value) => JsonSerializer.Deserialize<Dictionary<string, object?>>(JsonSerializer.Serialize(value, new JsonSerializerOptions(JsonSerializerDefaults.Web)))!;
    public static object PublicUser(User user) => new
    {
        _id = user.Id,
        user.DisplayName,
        user.Avatar,
        user.SkillLevel,
        user.Stats
    };
    public async Task<GroupPlay> RequireGroupAsync(string id, string userId, CancellationToken ct = default)
    {
        Guard.Id(id);
        var group = await db.GroupPlays.Find(g => g.Id == id).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
        if (group.IsChatDeleted || (group.OrganizerId != userId && !group.Participants.Any(p => p.UserId == userId)))
            throw ApiException.Forbidden("Group chat unavailable");
        return group;
    }

    public async Task<List<ChatMessage>> HistoryAsync(string id, string userId, int page, int limit, CancellationToken ct = default)
    {
        await RequireGroupAsync(id, userId, ct);
        (page, limit) = Guard.Page(page, limit);
        var messages = await db.ChatMessages.Find(m => m.GroupPlayId == id).SortByDescending(m => m.CreatedAt).Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        messages.Reverse();
        return messages;
    }

    public async Task DeleteGroupAsync(string id, string userId, CancellationToken ct = default)
    {
        var group = await RequireGroupAsync(id, userId, ct);
        if (group.OrganizerId != userId)
            throw ApiException.Forbidden();
        await db.GroupPlays.UpdateOneAsync(g => g.Id == id, Builders<GroupPlay>.Update.Set(g => g.IsChatDeleted, true), cancellationToken: ct);
        await db.ChatMessages.DeleteManyAsync(m => m.GroupPlayId == id, ct);
    }

    public async Task<Conversation> RequireConversationAsync(string id, string userId, CancellationToken ct = default)
    {
        Guard.Id(id);
        return await db.Conversations.Find(c => c.Id == id && c.Participants.Contains(userId)).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound("Conversation not found");
    }

    public async Task<object> PopulateAsync(Conversation conversation, CancellationToken ct = default)
    {
        var users = await db.Users.Find(u => conversation.Participants.Contains(u.Id)).ToListAsync(ct);
        var result = Document(conversation);
        result["participants"] = users.Select(PublicUser).ToArray();
        result["lastMessage"] = conversation.LastMessage == null ? null : await db.Messages.Find(m => m.Id == conversation.LastMessage).FirstOrDefaultAsync(ct);
        return result;
    }

    public async Task<List<object>> ConversationsAsync(string userId, CancellationToken ct = default)
    {
        var conversations = await db.Conversations.Find(c => c.Participants.Contains(userId) && !c.DeletedBy.Contains(userId)).SortByDescending(c => c.UpdatedAt).ToListAsync(ct);
        var result = new List<object>();
        foreach (var conversation in conversations)
            result.Add(await PopulateAsync(conversation, ct));
        return result;
    }

    public async Task<Conversation> GetOrCreateAsync(string userId, string recipientId, CancellationToken ct = default)
    {
        Guard.Id(recipientId);
        if (userId == recipientId)
            throw ApiException.BadRequest("Cannot create conversation with yourself");
        if (!await db.Users.Find(u => u.Id == recipientId).AnyAsync(ct))
            throw ApiException.NotFound("Recipient not found");
        var existing = await db.Conversations.Find(c => c.Participants.Count == 2 && c.Participants.Contains(userId) && c.Participants.Contains(recipientId)).FirstOrDefaultAsync(ct);
        if (existing != null)
            return existing;
        var pairKey = string.Join(":", new[] { userId, recipientId }.Order(StringComparer.Ordinal));
        var conversation = new Conversation
        {
            Participants = [userId, recipientId],
            PairKey = pairKey,
            UnreadCount = new()
            {
                [userId] = 0,
                [recipientId] = 0
            }
        };
        try
        {
            await db.Conversations.InsertOneAsync(conversation, cancellationToken: ct);
        }
        catch (MongoWriteException ex)when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return await db.Conversations.Find(c => c.PairKey == pairKey).FirstAsync(ct);
        }

        return conversation;
    }

    public async Task<List<Message>> MessagesAsync(string id, string userId, CancellationToken ct = default)
    {
        await RequireConversationAsync(id, userId, ct);
        var result = await db.Messages.Find(m => m.ConversationId == id && !m.DeletedBy.Contains(userId)).SortBy(m => m.CreatedAt).ToListAsync(ct);
        await db.Conversations.UpdateOneAsync(c => c.Id == id, Builders<Conversation>.Update.Set($"unreadCount.{userId}", 0), cancellationToken: ct);
        return result;
    }

    public async Task ArchiveAsync(string id, string userId, bool archived, CancellationToken ct = default)
    {
        await RequireConversationAsync(id, userId, ct);
        var update = archived ? Builders<Conversation>.Update.AddToSet(c => c.ArchivedBy, userId) : Builders<Conversation>.Update.Pull(c => c.ArchivedBy, userId);
        await db.Conversations.UpdateOneAsync(c => c.Id == id, update, cancellationToken: ct);
    }

    public async Task DeleteConversationAsync(string id, string userId, CancellationToken ct = default)
    {
        await RequireConversationAsync(id, userId, ct);
        await db.Conversations.UpdateOneAsync(c => c.Id == id, Builders<Conversation>.Update.AddToSet(c => c.DeletedBy, userId).Pull(c => c.ArchivedBy, userId), cancellationToken: ct);
    }

    public async Task DeleteMessageAsync(string id, string userId, string type, CancellationToken ct = default)
    {
        Guard.Id(id);
        if (type is not ("recall" or "delete"))
            throw ApiException.BadRequest("Invalid deletion type");
        var message = await db.Messages.Find(m => m.Id == id).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
        await RequireConversationAsync(message.ConversationId, userId, ct);
        if (type == "recall" && message.SenderId != userId)
            throw ApiException.Forbidden("Only sender can recall the message");
        await db.Messages.UpdateOneAsync(m => m.Id == id, type == "recall" ? Builders<Message>.Update.Set(m => m.IsRecalled, true) : Builders<Message>.Update.AddToSet(m => m.DeletedBy, userId), cancellationToken: ct);
    }

    public async Task SendGroupAsync(string userId, SendChat request, CancellationToken ct = default)
    {
        await RequireGroupAsync(request.GroupPlayId ?? "", userId, ct);
        var user = await db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync(ct) ?? throw ApiException.Unauthorized();
        MessageReply? reply = null;
        if (request.ReplyTo != null)
        {
            Guard.Id(request.ReplyTo.MessageId);
            var original = await db.ChatMessages.Find(m => m.Id == request.ReplyTo.MessageId && m.GroupPlayId == request.GroupPlayId).FirstOrDefaultAsync(ct) ?? throw ApiException.BadRequest("Reply message not found in this group");
            reply = new()
            {
                MessageId = original.Id,
                SenderName = original.SenderName,
                Content = original.Content
            };
        }

        var message = new ChatMessage
        {
            GroupPlayId = request.GroupPlayId!,
            SenderId = userId,
            SenderName = user.DisplayName,
            SenderAvatar = user.Avatar,
            Content = Guard.Text(request.Content, "Content", 1000),
            ReplyTo = reply
        };
        await db.ChatMessages.InsertOneAsync(message, cancellationToken: ct);
        await realtime.RoomAsync($"group_play:{message.GroupPlayId}", "chat:message", message, ct);
    }

    public async Task SendDirectAsync(string userId, SendChat request, CancellationToken ct = default)
    {
        var conversation = await RequireConversationAsync(request.ConversationId ?? "", userId, ct);
        var recipient = conversation.Participants.FirstOrDefault(id => id != userId) ?? throw ApiException.BadRequest("Recipient not found");
        if (request.RecipientId != recipient)
            throw ApiException.Forbidden("Invalid recipient");
        var user = await db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync(ct) ?? throw ApiException.Unauthorized();
        MessageReply? reply = null;
        if (request.ReplyTo != null)
        {
            Guard.Id(request.ReplyTo.MessageId);
            var original = await db.Messages.Find(m => m.Id == request.ReplyTo.MessageId && m.ConversationId == conversation.Id).FirstOrDefaultAsync(ct) ?? throw ApiException.BadRequest("Reply message not found in this conversation");
            reply = new()
            {
                MessageId = original.Id,
                SenderName = original.SenderName ?? "",
                Content = original.IsRecalled ? "Tin nhắn đã bị thu hồi" : original.Content
            };
        }

        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderId = userId,
            SenderName = user.DisplayName,
            SenderAvatar = user.Avatar,
            Content = Guard.Text(request.Content, "Content", 2000),
            ReplyTo = reply
        };
        await db.Messages.InsertOneAsync(message, cancellationToken: ct);
        await db.Conversations.UpdateOneAsync(c => c.Id == conversation.Id, Builders<Conversation>.Update.Set(c => c.LastMessage, message.Id).Set(c => c.UpdatedAt, DateTime.UtcNow).Inc($"unreadCount.{recipient}", 1), cancellationToken: ct);
        await realtime.UserAsync(recipient, "chat:direct_message", message, ct);
        await realtime.UserAsync(userId, "chat:direct_message", message, ct);
    }
}

public sealed record SendChat(string? GroupPlayId, string? ConversationId, string? RecipientId, string Content, MessageReply? ReplyTo);
