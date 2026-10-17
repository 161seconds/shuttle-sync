namespace ShuttleSync.Service.Account;
public sealed class ProfileRequest
{
    [System.Text.Json.Serialization.JsonExtensionData]
    public Dictionary<string, System.Text.Json.JsonElement> Fields { get; set; } = [];
}
