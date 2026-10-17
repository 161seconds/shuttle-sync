using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Chat;
public sealed record SendChat(string? GroupPlayId, string? ConversationId, string? RecipientId, string Content, MessageReply? ReplyTo);

public sealed record RecipientRequest(string RecipientId);
public sealed record ArchiveRequest(bool IsArchived);
public sealed record DeleteMessageRequest(string Type);
