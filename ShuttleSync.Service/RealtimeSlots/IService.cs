namespace ShuttleSync.Service.RealtimeSlots;
public interface IRealtimeSlotService
{
    Task SelectAsync(string userId, SlotRequest input, bool select, CancellationToken ct);
    Task ReleaseAsync(string userId, CancellationToken ct = default);
}
