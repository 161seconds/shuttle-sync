using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using System.Text.Json;

namespace ShuttleSync.Service.Social;
public sealed class TournamentService(MongoContext db)
{
    public async Task<Tournament> GetAsync(string id, CancellationToken ct = default)
    {
        Guard.Id(id);
        return await db.Tournaments.Find(t => t.Id == id).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
    }

    public Task<List<Tournament>> MyAsync(string userId, CancellationToken ct = default) => db.Tournaments.Find(t => t.OrganizerId == userId || t.Teams.Any(team => team.Members.Contains(userId))).SortByDescending(t => t.CreatedAt).ToListAsync(ct);
    public async Task<Tournament> QuickAsync(string userId, string? title, CancellationToken ct = default)
    {
        var tour = new Tournament
        {
            Title = title is null ? "Giải Cầu Lông Mở Rộng 2026" : Guard.Text(title, "Title", 200),
            Description = "Giải đấu test hệ thống tự động chia nhánh.",
            OrganizerId = userId,
            CourtId = ObjectId.GenerateNewId().ToString(),
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1),
            RegistrationDeadline = DateTime.UtcNow,
            MaxTeams = 8,
            CurrentTeams = 5,
            ContactInfo = "0909123456",
            Teams = new[]
            {
                "Nhóm Q.Bảo",
                "Team Flash",
                "Gà Con",
                "Sát Thủ",
                "Cầu Lông 8x"
            }.Select(name => new TournamentTeam { Name = name, HasPaid = true }).ToList()
        };
        await db.Tournaments.InsertOneAsync(tour, cancellationToken: ct);
        return await StartAsync(tour.Id, userId, ct);
    }

    public async Task<Tournament> StartAsync(string id, string userId, CancellationToken ct = default)
    {
        var tour = await GetAsync(id, ct);
        if (tour.OrganizerId != userId)
            throw ApiException.Forbidden();
        if (tour.Status is not ("draft" or "registration_open" or "registration_closed") || tour.Matches.Count != 0)
            throw ApiException.Conflict("Tournament has already started");
        if (tour.Teams.Count < 2)
            throw ApiException.BadRequest("At least two teams required");
        GenerateBracket(tour);
        tour.Status = "in_progress";
        await SaveAsync(tour, ct);
        return tour;
    }

    public static void GenerateBracket(Tournament tour)
    {
        var teams = tour.Teams.ToArray();
        Random.Shared.Shuffle(teams);
        var size = 2;
        while (size < teams.Length)
            size *= 2;
        var byes = size - teams.Length;
        var index = 0;
        var number = 1;
        tour.Matches = [];
        for (var i = 1; i <= size / 2; i++)
        {
            var first = index < teams.Length ? teams[index++].Id : null;
            var second = index < teams.Length && i > byes ? teams[index++].Id : null;
            tour.Matches.Add(new() { Round = 1, MatchNumber = number++, Team1Id = first, Team2Id = second, WinnerId = second == null ? first : null, Score1 = second == null ? 21 : null, Score2 = second == null ? 0 : null });
        }

        for (var round = 2; round <= (int)Math.Log2(size); round++)
            for (var i = 0; i < size / (1 << round); i++)
                tour.Matches.Add(new() { Round = round, MatchNumber = number++ });
        Advance(tour);
    }

    public static void Advance(Tournament tour)
    {
        for (var round = 1; round < tour.Matches.Max(m => m.Round); round++)
        {
            var current = tour.Matches.Where(m => m.Round == round).ToList();
            var next = tour.Matches.Where(m => m.Round == round + 1).ToList();
            for (var i = 0; i < current.Count; i++)
            {
                var target = next[i / 2];
                var winner = current[i].WinnerId;
                var changed = (i % 2 == 0 ? target.Team1Id : target.Team2Id) != winner;
                if (!changed)
                    continue;
                if (i % 2 == 0)
                    target.Team1Id = winner;
                else
                    target.Team2Id = winner;
                target.WinnerId = null;
                target.Score1 = null;
                target.Score2 = null;
            }
        }
    }

    async Task SaveAsync(Tournament tour, CancellationToken ct)
    {
        var version = tour.Version;
        tour.Version++;
        tour.UpdatedAt = DateTime.UtcNow;
        var f = Builders<Tournament>.Filter;
        var concurrency = f.Eq(t => t.Version, version);
        if (version == 0)
            concurrency |= f.Exists("__v", false);
        if ((await db.Tournaments.ReplaceOneAsync(f.Eq(t => t.Id, tour.Id) & concurrency, tour, cancellationToken: ct)).MatchedCount == 0)
            throw ApiException.Conflict("Tournament changed, please retry");
    }

    public async Task<Tournament> UpdateAsync(string id, string matchId, string userId, JsonElement update, CancellationToken ct = default)
    {
        Guard.Id(matchId);
        var tour = await GetAsync(id, ct);
        if (tour.OrganizerId != userId)
            throw ApiException.Forbidden();
        if (tour.Status is not ("in_progress" or "completed"))
            throw ApiException.Conflict("Tournament is not in progress");
        if (update.ValueKind != JsonValueKind.Object || update.EnumerateObject().Any(p => p.Name is not ("slot" or "teamId" or "score1" or "score2" or "winnerId")))
            throw ApiException.BadRequest("Invalid match update");
        var match = tour.Matches.FirstOrDefault(m => m.Id == matchId) ?? throw ApiException.NotFound();
        if (update.TryGetProperty("teamId", out var teamValue))
        {
            var team = OptionalId(teamValue);
            if (team != null && !tour.Teams.Any(t => t.Id == team))
                throw ApiException.BadRequest("Unknown team");
            if (!update.TryGetProperty("slot", out var slotValue) || slotValue.ValueKind != JsonValueKind.Number || !slotValue.TryGetInt32(out var slot) || slot is not (1 or 2))
                throw ApiException.BadRequest("Invalid slot");
            if (slot == 1)
                match.Team1Id = team;
            else
                match.Team2Id = team;
            match.WinnerId = null;
            match.Score1 = null;
            match.Score2 = null;
        }

        if (update.TryGetProperty("score1", out var first))
            match.Score1 = Score(first);
        if (update.TryGetProperty("score2", out var second))
            match.Score2 = Score(second);
        if (update.TryGetProperty("winnerId", out var winnerValue))
        {
            var winner = OptionalId(winnerValue);
            if (winner != null && winner != match.Team1Id && winner != match.Team2Id)
                throw ApiException.BadRequest("Winner must be a team in this match");
            match.WinnerId = winner;
        }

        Advance(tour);
        tour.Status = tour.Matches.Last().WinnerId == null ? "in_progress" : "completed";
        await SaveAsync(tour, ct);
        return tour;
    }

    static string? OptionalId(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.Null)
            return null;
        if (value.ValueKind != JsonValueKind.String)
            throw ApiException.BadRequest("Invalid ID");
        var id = value.GetString();
        return string.IsNullOrEmpty(id) ? null : Guard.Id(id);
    }

    static int Score(JsonElement value) => value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var score) && score is >= 0 and <= 1000 ? score : throw ApiException.BadRequest("Invalid score");
}
