namespace ShuttleSync.Service.Common;
public interface IRealtime
{
    Task UserAsync(string userId, string eventName, object payload, CancellationToken ct = default);
    Task RoomAsync(string room, string eventName, object payload, CancellationToken ct = default);
    Task DisconnectAsync(string userId, CancellationToken ct = default);
}
