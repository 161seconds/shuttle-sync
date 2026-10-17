using ShuttleSync.Service.RealtimeSlots.Validator;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.RealtimeSlots;
public sealed class RealtimeSlotService(MongoContext db, IRealtime realtime) : IRealtimeSlotService
{
    public async Task SelectAsync(string userId, SlotRequest input, bool select, CancellationToken ct)
    {
        var (courtId, slotId) = SlotValidator.Ids(input);
        var f = Builders<TimeSlot>.Filter;
        var filter = f.Eq(s => s.Id, slotId) & f.Eq(s => s.CourtId, courtId);
        filter &= select ? f.Or(f.Eq(s => s.Status, "available"), f.Eq(s => s.Status, "selected") & f.Lt(s => s.LockedAt, DateTime.UtcNow.AddMinutes(-5))) : f.Eq(s => s.Status, "selected") & f.Eq(s => s.LockedBy, userId);
        var slot = await db.TimeSlots.FindOneAndUpdateAsync(filter, Builders<TimeSlot>.Update.Set(s => s.Status, select ? "selected" : "available").Set(s => s.LockedBy, select ? userId : null).Set(s => s.LockedAt, select ? DateTime.UtcNow : null), new() { ReturnDocument = ReturnDocument.After }, ct);
        if (slot == null)
            throw ApiException.Conflict("Slot is not available");
        await realtime.RoomAsync($"court:{courtId}", select ? "slot:select" : "slot:released", new SlotSelectionResponse(slotId, courtId, userId, select ? userId : null), ct);
    }

    public async Task ReleaseAsync(string userId, CancellationToken ct = default)
    {
        var slots = await db.TimeSlots.Find(s => s.LockedBy == userId && s.Status == "selected").ToListAsync(ct);
        foreach (var slot in slots)
        {
            var result = await db.TimeSlots.UpdateOneAsync(s => s.Id == slot.Id && s.LockedBy == userId && s.Status == "selected", Builders<TimeSlot>.Update.Set(s => s.Status, "available").Set(s => s.LockedBy, null).Set(s => s.LockedAt, null), cancellationToken: ct);
            if (result.ModifiedCount > 0)
                await realtime.RoomAsync($"court:{slot.CourtId}", "slot:released", new SlotReleasedResponse(slot.Id, slot.CourtId), ct);
        }
    }
}
