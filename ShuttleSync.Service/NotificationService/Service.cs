using ShuttleSync.Service.NotificationService.Validator;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.NotificationService;
public sealed class Service(MongoContext db, IRealtime realtime) : INotificationService
{
    public async Task<Notification> CreateAsync(string userId, string title, string message, string type = "system", string? link = null, BsonDocument? data = null, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = Guard.Id(userId),
            Title = title,
            Message = message,
            Type = type,
            Link = link,
            Data = data
        };
        await db.Notifications.InsertOneAsync(notification, cancellationToken: ct);
        await realtime.UserAsync(userId, "notification", notification, ct);
        return notification;
    }

    public async Task<(object Data, object Pagination)> GetAsync(string userId, NotificationQuery query, CancellationToken ct)
    {
        var (page, limit) = NotificationValidator.Page(query);
        var filter = Builders<Notification>.Filter.Eq(n => n.UserId, userId);
        if (query.UnreadOnly)
            filter &= Builders<Notification>.Filter.Eq(n => n.IsRead, false);
        var total = await db.Notifications.CountDocumentsAsync(filter, cancellationToken: ct);
        var notifications = await db.Notifications.Find(filter).SortByDescending(n => n.CreatedAt).Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        var unreadCount = await db.Notifications.CountDocumentsAsync(n => n.UserId == userId && !n.IsRead, cancellationToken: ct);
        return (new NotificationListResponse(notifications, unreadCount), Guard.Pagination(page, limit, total));
    }

    public async Task ReadAsync(string id, string userId, CancellationToken ct)
    {
        Guard.Id(id);
        var result = await db.Notifications.UpdateOneAsync(n => n.Id == id && n.UserId == userId, Builders<Notification>.Update.Set(n => n.IsRead, true).Set(n => n.ReadAt, DateTime.UtcNow), cancellationToken: ct);
        if (result.MatchedCount == 0)
            throw ApiException.NotFound("Không tìm thấy thông báo");
    }

    public Task ReadAllAsync(string userId, CancellationToken ct) => db.Notifications.UpdateManyAsync(n => n.UserId == userId && !n.IsRead, Builders<Notification>.Update.Set(n => n.IsRead, true).Set(n => n.ReadAt, DateTime.UtcNow), cancellationToken: ct);
}
