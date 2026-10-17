namespace ShuttleSync.Service.GroupPlays;
public sealed record CreateGroup(string Title, string? Description, string CourtId, string SubCourtId, string BookingId, DateTime Date, string StartTime, string EndTime, string SportType, string SkillLevel, int MaxPlayers, double PricePerPlayer, bool IsPublic = true, string? Requirements = null, string? ContactInfo = null);
public sealed record GroupSearch(string? SportType = null, string? SkillLevel = null, DateTime? Date = null, string? District = null, string? Status = null, int Page = 1, int Limit = 20);

public sealed record ReasonRequest(string? Reason);
