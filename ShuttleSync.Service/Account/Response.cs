namespace ShuttleSync.Service.Account;
public sealed record PublicProfileResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("_id")] string Id,
    string DisplayName, string? Avatar, string? SkillLevel, string Status, DateTime JoinedDate, PublicStatsResponse Stats);
public sealed record PublicStatsResponse(double Rating, int ReviewCount, int TotalGroupsCreated, int TotalGroupsJoined, int EloScore, int ActivityStreak);
