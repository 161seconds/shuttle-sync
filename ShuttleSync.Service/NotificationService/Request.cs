namespace ShuttleSync.Service.NotificationService;
public sealed record NotificationQuery(bool UnreadOnly = false, int Page = 1, int Limit = 20);
