using ShuttleSync.Repository.Entities;
using MongoDB.Bson;

namespace ShuttleSync.Service.NotificationService;
public interface INotificationService
{
    Task<Notification> CreateAsync(string userId, string title, string message, string type = "system", string? link = null, BsonDocument? data = null, CancellationToken ct = default);
    Task<(object Data, object Pagination)> GetAsync(string userId, NotificationQuery query, CancellationToken ct);
    Task ReadAsync(string id, string userId, CancellationToken ct);
    Task ReadAllAsync(string userId, CancellationToken ct);
}
