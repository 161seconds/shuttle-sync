using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.Social;

namespace ShuttleSync.Test;
public static class SocialTests
{
    public static async Task RunAsync(MongoContext db, IServiceProvider services)
    {
        var legacy = new GroupPlay
        {
            OrganizerId = ObjectId.GenerateNewId().ToString(),
            CourtId = ObjectId.GenerateNewId().ToString(),
            SubCourtId = ObjectId.GenerateNewId().ToString(),
            BookingId = ObjectId.GenerateNewId().ToString(),
            PricePerPlayer = 12345.5,
            Participants = [new()
            {
                UserId = ObjectId.GenerateNewId().ToString(),
                DisplayName = "Legacy member"
            }

            ]
        }.ToBsonDocument();
        legacy["legacyFlag"] = "preserved";
        legacy["participants"][0].AsBsonDocument["legacyMemberFlag"] = true;
        var roundTrip = BsonSerializer.Deserialize<GroupPlay>(legacy).ToBsonDocument();
        Assert.True(roundTrip["pricePerPlayer"].BsonType == BsonType.Double && roundTrip["pricePerPlayer"].AsDouble == 12345.5, "social prices preserve legacy BSON double representation");
        Assert.True(roundTrip["legacyFlag"] == "preserved" && roundTrip["participants"][0]["legacyMemberFlag"].AsBoolean, "social replacements retain legacy unknown document and embedded fields");
        Assert.True(roundTrip["participants"][0]["_id"] == legacy["participants"][0]["_id"], "social embedded participant IDs survive round trip");
        using var scope = services.CreateScope();
        var chat = scope.ServiceProvider.GetRequiredService<ChatService>();
        var friends = scope.ServiceProvider.GetRequiredService<FriendService>();
        var groups = scope.ServiceProvider.GetRequiredService<GroupPlayService>();
        var tournaments = scope.ServiceProvider.GetRequiredService<TournamentService>();
        var owner = new User
        {
            Email = "social-owner@example.test",
            DisplayName = "Actual owner"
        };
        var first = new User
        {
            Email = "social-first@example.test",
            DisplayName = "Actual first"
        };
        var second = new User
        {
            Email = "social-second@example.test",
            DisplayName = "Actual second"
        };
        await db.Users.InsertManyAsync([owner, first, second]);
        await SocialIndexes.EnsureIndexesAsync(db);
        var concurrentConversations = await Task.WhenAll(chat.GetOrCreateAsync(first.Id, second.Id), chat.GetOrCreateAsync(second.Id, first.Id));
        Assert.True(concurrentConversations[0].Id == concurrentConversations[1].Id, "concurrent reversed conversation creation uses one pair");
        var group = new GroupPlay
        {
            Title = "Capacity test",
            OrganizerId = owner.Id,
            CourtId = ObjectId.GenerateNewId().ToString(),
            SubCourtId = ObjectId.GenerateNewId().ToString(),
            BookingId = ObjectId.GenerateNewId().ToString(),
            Date = DateTime.UtcNow.AddDays(1),
            StartTime = "09:00",
            EndTime = "10:00",
            MaxPlayers = 2,
            Participants = [new()
            {
                UserId = owner.Id,
                DisplayName = owner.DisplayName,
                Role = "organizer"
            }

            ],
            JoinRequests = [new()
            {
                UserId = first.Id,
                DisplayName = first.DisplayName
            }, new()
            {
                UserId = second.Id,
                DisplayName = second.DisplayName
            }

            ]
        };
        await db.GroupPlays.InsertOneAsync(group);
        await TestAssert.ThrowsAsync<ApiException>(() => chat.RequireGroupAsync(group.Id, first.Id), "pending requester cannot read group chat");
        await TestAssert.ThrowsAsync<ApiException>(() => groups.RequestAsync(group.Id, first.Id, second.Id, true, null), "only organizer can accept a group request");
        var outcomes = await Task.WhenAll(new[] { first.Id, second.Id }.Select(async userId =>
        {
            try
            {
                await groups.RequestAsync(group.Id, userId, owner.Id, true, null);
                return true;
            }
            catch (ApiException)
            {
                return false;
            }
        }));
        Assert.True(outcomes.Count(success => success) == 1, "concurrent group approval never exceeds capacity");
        group = await groups.GetAsync(group.Id);
        Assert.True(group.CurrentPlayers == 2 && group.Participants.Count == 2 && group.Status == "full", "group count, members and full status agree");
        var member = group.Participants.Single(p => p.UserId != owner.Id).UserId;
        await chat.SendGroupAsync(member, new(group.Id, null, null, "Group hello", null));
        var history = await chat.HistoryAsync(group.Id, owner.Id, 1, 50);
        Assert.True(history.Single().SenderId == member && history.Single().SenderName == (member == first.Id ? first.DisplayName : second.DisplayName), "group sender identity comes from authenticated database user");
        await TestAssert.ThrowsAsync<ApiException>(() => chat.SendGroupAsync(ObjectId.GenerateNewId().ToString(), new(group.Id, null, null, "blocked", null)), "non-member cannot publish group messages");
        var conversation = await chat.GetOrCreateAsync(owner.Id, first.Id);
        await TestAssert.ThrowsAsync<ApiException>(() => chat.MessagesAsync(conversation.Id, second.Id), "outsider cannot read direct conversation");
        await TestAssert.ThrowsAsync<ApiException>(() => chat.SendDirectAsync(owner.Id, new(null, conversation.Id, second.Id, "blocked", null)), "direct recipient must belong to conversation");
        await chat.SendDirectAsync(owner.Id, new(null, conversation.Id, first.Id, "Direct hello", null));
        var direct = (await chat.MessagesAsync(conversation.Id, first.Id)).Single();
        Assert.True(direct.SenderName == owner.DisplayName && direct.SenderId == owner.Id, "direct message sender identity comes from server");
        await TestAssert.ThrowsAsync<ApiException>(() => chat.DeleteMessageAsync(direct.Id, first.Id, "recall"), "recipient cannot recall another sender message");
        await TestAssert.ThrowsAsync<ApiException>(() => chat.DeleteMessageAsync(direct.Id, second.Id, "delete"), "outsider cannot delete conversation messages");
        await friends.RequestAsync(owner.Id, first.Id);
        await TestAssert.ThrowsAsync<ApiException>(() => friends.RequestAsync(first.Id, owner.Id), "reversed duplicate friend request is rejected");
        Assert.True(await db.Friendships.CountDocumentsAsync(f => (f.RequesterId == owner.Id && f.RecipientId == first.Id) || (f.RequesterId == first.Id && f.RecipientId == owner.Id)) == 1, "friend request remains a single document");
        var tour = new Tournament
        {
            Title = "Bracket test",
            OrganizerId = owner.Id,
            CourtId = group.CourtId,
            Teams = Enumerable.Range(1, 5).Select(i => new TournamentTeam { Name = $"Team {i}" }).ToList()
        };
        await db.Tournaments.InsertOneAsync(tour);
        await TestAssert.ThrowsAsync<ApiException>(() => tournaments.StartAsync(tour.Id, first.Id), "non-organizer cannot start tournament");
        tour = await tournaments.StartAsync(tour.Id, owner.Id);
        Assert.True(tour.Matches.Count == 7 && tour.Matches.Count(m => m.Round == 1) == 4, "five teams generate an eight-slot bracket");
        Assert.True(tour.Matches.Where(m => m.Round == 1).Count(m => m.WinnerId != null) == 3, "bracket generates exactly three byes");
        await TestAssert.ThrowsAsync<ApiException>(() => tournaments.StartAsync(tour.Id, owner.Id), "tournament bracket starts only once");
        var match = tour.Matches.First(m => m.Team1Id != null && m.Team2Id != null);
        await TestAssert.ThrowsAsync<ApiException>(() => tournaments.UpdateAsync(tour.Id, match.Id, owner.Id, System.Text.Json.JsonSerializer.SerializeToElement(new { winnerId = ObjectId.GenerateNewId().ToString() })), "winner must be a participant in the match");
        await tournaments.UpdateAsync(tour.Id, match.Id, owner.Id, System.Text.Json.JsonSerializer.SerializeToElement(new { score1 = 21, score2 = 10, winnerId = match.Team1Id }));
        Assert.True((await tournaments.GetAsync(tour.Id)).Matches.Single(m => m.Id == match.Id).WinnerId == match.Team1Id, "valid match result persists");
    }
}
