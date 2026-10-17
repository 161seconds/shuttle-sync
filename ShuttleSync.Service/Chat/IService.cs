using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Chat;
public interface IChatService
{
    Task<GroupPlay> RequireGroupAsync(string id, string userId, CancellationToken ct = default);
    Task<List<ChatMessage>> HistoryAsync(string id, string userId, int page, int limit, CancellationToken ct = default);
    Task DeleteGroupAsync(string id, string userId, CancellationToken ct = default);
    Task<Conversation> RequireConversationAsync(string id, string userId, CancellationToken ct = default);
    Task<object> PopulateAsync(Conversation conversation, CancellationToken ct = default);
    Task<List<object>> ConversationsAsync(string userId, CancellationToken ct = default);
    Task<Conversation> GetOrCreateAsync(string userId, string recipientId, CancellationToken ct = default);
    Task<List<Message>> MessagesAsync(string id, string userId, CancellationToken ct = default);
    Task ArchiveAsync(string id, string userId, bool archived, CancellationToken ct = default);
    Task DeleteConversationAsync(string id, string userId, CancellationToken ct = default);
    Task DeleteMessageAsync(string id, string userId, string type, CancellationToken ct = default);
    Task SendGroupAsync(string userId, SendChat request, CancellationToken ct = default);
    Task SendDirectAsync(string userId, SendChat request, CancellationToken ct = default);
}
