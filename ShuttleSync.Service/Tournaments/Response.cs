using ShuttleSync.Repository.Entities;
using System.Text.Json.Serialization;

namespace ShuttleSync.Service.Tournaments;
public sealed record TournamentResponse(
    [property: JsonPropertyName("_id")] string Id,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    [property: JsonPropertyName("__v")] int Version,
    string Title,
    string Description,
    string OrganizerId,
    string CourtId,
    string SportType,
    string Format,
    string Status,
    DateTime StartDate,
    DateTime EndDate,
    DateTime RegistrationDeadline,
    int MaxTeams,
    int CurrentTeams,
    double EntryFee,
    List<TournamentPrize> Prizes,
    string? Rules,
    string ContactInfo,
    string? BannerImage,
    List<TournamentTeam> Teams,
    List<TournamentMatch> Matches)
{
    public static TournamentResponse From(Tournament value) => new(
        value.Id, value.CreatedAt, value.UpdatedAt, value.Version, value.Title, value.Description, value.OrganizerId, value.CourtId, value.SportType, value.Format, value.Status, value.StartDate, value.EndDate, value.RegistrationDeadline, value.MaxTeams, value.CurrentTeams, value.EntryFee, value.Prizes, value.Rules, value.ContactInfo, value.BannerImage, value.Teams, value.Matches);
}
