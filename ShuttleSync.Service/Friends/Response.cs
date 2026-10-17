namespace ShuttleSync.Service.Friends;
public sealed record FriendRequestResponse(string RequesterId, string RequesterName);
public sealed record FriendshipResponse(string Status, int RejectionCount, bool IsRequester);
