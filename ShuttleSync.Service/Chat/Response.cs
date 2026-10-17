using ShuttleSync.Repository.Entities;
using System.Text.Json;

namespace ShuttleSync.Service.Chat;
public static class ChatResponse
{
    public static Dictionary<string, object?> Document<T>(T value) => JsonSerializer.Deserialize<Dictionary<string, object?>>(JsonSerializer.Serialize(value, new JsonSerializerOptions(JsonSerializerDefaults.Web)))!;
    public static object PublicUser(User user) => new
    {
        _id = user.Id,
        user.DisplayName,
        user.Avatar,
        user.SkillLevel,
        user.Stats
    };
}
