using System.Text.Json;

namespace ShuttleSync.Service.AiCoach;
public sealed record CoachResponse(string? Reply, JsonElement Suggestions);
