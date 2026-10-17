using System.Text.Json;
using System.Text.Json.Nodes;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Tournaments;

namespace ShuttleSync.Test;

public sealed class ServiceContractsTests
{
    [Fact]
    public void TournamentResponsePreservesExistingJson()
    {
        var tournament = new Tournament
        {
            Title = "Contract test",
            OrganizerId = "507f1f77bcf86cd799439011",
            CourtId = "507f1f77bcf86cd799439012",
            Status = "in_progress",
            EntryFee = 150000,
            Rules = "Best of three",
            BannerImage = "https://example.test/banner.png",
            Version = 3,
            Teams = [new() { Name = "Team A", Members = ["507f1f77bcf86cd799439011"], HasPaid = true }],
            Matches = [new() { Round = 1, MatchNumber = 1, Score1 = 21, Score2 = 15 }],
            Prizes = [new() { Position = 1, Description = "Winner", Amount = 1000000 }]
        };
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        Assert.True(JsonNode.DeepEquals(JsonSerializer.SerializeToNode(tournament, options),
            JsonSerializer.SerializeToNode(TournamentResponse.From(tournament), options)));
    }
}
