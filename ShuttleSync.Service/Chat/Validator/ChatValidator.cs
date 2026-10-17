using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Chat.Validator;
public static class ChatValidator
{
    public static void Recipient(string userId, string recipientId)
    {
        Guard.Id(recipientId);
        if (userId == recipientId)
            throw ApiException.BadRequest("Cannot create conversation with yourself");
    }

    public static void DeletionType(string type)
    {
        if (type is not ("recall" or "delete"))
            throw ApiException.BadRequest("Invalid deletion type");
    }

    public static string Content(SendChat request, int max) => Guard.Text(request.Content, "Content", max);
}
