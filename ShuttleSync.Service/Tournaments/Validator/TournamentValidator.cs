using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using System.Text.Json;

namespace ShuttleSync.Service.Tournaments.Validator;
public static class TournamentValidator
{
    public static string? OptionalId(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.Null)
            return null;
        if (value.ValueKind != JsonValueKind.String)
            throw ApiException.BadRequest("Invalid ID");
        var id = value.GetString();
        return string.IsNullOrEmpty(id) ? null : Guard.Id(id);
    }

    public static int Score(JsonElement value) => value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var score) && score is >= 0 and <= 1000 ? score : throw ApiException.BadRequest("Invalid score");

    public static void Match(MatchRequest input)
    {
        if (input.Fields.Keys.Any(name => name is not ("slot" or "teamId" or "score1" or "score2" or "winnerId")))
            throw ApiException.BadRequest("Invalid match update");
    }

    public static string Title(string? title) => title is null ? "Giải Cầu Lông Mở Rộng 2026" : Guard.Text(title, "Title", 200);
}
