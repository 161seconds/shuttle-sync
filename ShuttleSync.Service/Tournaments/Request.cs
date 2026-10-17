namespace ShuttleSync.Service.Tournaments;
public sealed record TitleRequest(string? Title);
public sealed class MatchRequest
{
    [System.Text.Json.Serialization.JsonExtensionData]
    public Dictionary<string, System.Text.Json.JsonElement> Fields { get; set; } = [];
}
