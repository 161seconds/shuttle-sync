namespace ShuttleSync.Service.RealtimeSlots;
public sealed record SlotSelectionResponse(string SlotId, string CourtId, string UserId, string? LockedBy);
public sealed record SlotReleasedResponse(string SlotId, string CourtId);
