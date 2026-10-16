using MongoDB.Bson;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.NotificationService;
public interface INotificationService
{
    Task<Notification> CreateAsync(string userId, string title, string message, string type = "system", string? link = null, BsonDocument? data = null, CancellationToken ct = default);
}
