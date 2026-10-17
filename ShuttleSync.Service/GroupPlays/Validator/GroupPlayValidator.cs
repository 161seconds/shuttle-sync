using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.GroupPlays.Validator;
public static class GroupPlayValidator
{
    public static void Skill(string value)
    {
        if (value is not ("y" or "y_minus" or "y_plus" or "tby_minus" or "tby" or "tby_plus" or "tb_minus" or "tb" or "tb_plus" or "tb_plus_2" or "tb_plus_3" or "tbk" or "bc" or "cn"))
            throw ApiException.BadRequest("Invalid skill level");
    }

    public static void Search(GroupSearch query)
    {
        if (query.SportType != null && query.SportType is not ("badminton" or "pickleball"))
            throw ApiException.BadRequest("Invalid sport");
        if (query.Status != null && query.Status is not ("open" or "full" or "in_progress" or "completed" or "cancelled"))
            throw ApiException.BadRequest("Invalid status");
        if (query.SkillLevel != null)
            Skill(query.SkillLevel);
    }

    public static string Create(CreateGroup request)
    {
        Guard.Id(request.CourtId);
        Guard.Id(request.SubCourtId);
        Guard.Id(request.BookingId);
        var title = Guard.Text(request.Title, "Title", 100, 2);
        Skill(request.SkillLevel);
        if (request.Date == default)
            throw ApiException.BadRequest("Invalid date");
        if (request.MaxPlayers is < 2 or > 30 || !double.IsFinite(request.PricePerPlayer) || request.PricePerPlayer < 0 || request.Description?.Length > 500 || request.Requirements?.Length > 300 || request.SportType is not ("badminton" or "pickleball"))
            throw ApiException.BadRequest("Invalid group details");
        if (!TimeOnly.TryParseExact(request.StartTime, "HH:mm", out var start) || !TimeOnly.TryParseExact(request.EndTime, "HH:mm", out var end) || end <= start)
            throw ApiException.BadRequest("Invalid time range");
        return title;
    }
}
