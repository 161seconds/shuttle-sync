using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.NotificationService;
public sealed record NotificationListResponse(List<Notification> Notifications, long UnreadCount);
