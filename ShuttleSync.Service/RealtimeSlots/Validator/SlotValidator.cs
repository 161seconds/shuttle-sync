using ShuttleSync.Service.Common;

namespace ShuttleSync.Service.RealtimeSlots.Validator;
public static class SlotValidator
{
    public static (string CourtId, string SlotId) Ids(SlotRequest input) => (Guard.Id(input.CourtId), Guard.Id(input.SlotId));
}
