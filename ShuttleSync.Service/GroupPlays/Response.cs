using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Chat;

namespace ShuttleSync.Service.GroupPlays;
public static class GroupPlayResponse
{
    public static object From(GroupPlay group, User? user, Venue? venue, bool detail)
    {
        var result = ChatResponse.Document(group);
        result["organizerId"] = user == null ? null : detail ? new
        {
            _id = user.Id,
            user.DisplayName,
            user.Avatar,
            user.Phone,
            user.Stats
        }

        : ChatResponse.PublicUser(user);
        result["courtId"] = venue;
        return result;
    }
}
