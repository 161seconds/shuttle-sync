using ShuttleSync.Service.Common;

namespace ShuttleSync.Service.NotificationService.Validator;
public static class NotificationValidator
{
    public static (int Page, int Limit) Page(NotificationQuery query) => Guard.Page(query.Page, query.Limit);
}
