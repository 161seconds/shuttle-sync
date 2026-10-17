using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Friends.Validator;
public static class FriendValidator
{
    public static void Recipient(string userId, string recipientId)
    {
        Guard.Id(recipientId);
        if (recipientId == userId)
            throw ApiException.BadRequest("Cannot send request to yourself");
    }

    public static string Query(string query) => Guard.Text(query, "Query", 100);
}
