using ShuttleSync.Service.Account.Validator;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Account;
public sealed class Service(MongoContext db) : IAccountService
{
    public async Task<User> GetAsync(string id, CancellationToken ct) => await db.Users.Find(x => x.Id == Guard.Id(id)).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
    public async Task<User> ProfileAsync(string id, bool computed, CancellationToken ct)
    {
        var user = await GetAsync(id, ct);
        if (!computed)
            return user;
        var day = DateTime.UtcNow.Date;
        if (user.LastActiveDate?.Date != day)
        {
            user.Stats.ActivityStreak = user.LastActiveDate?.Date == day.AddDays(-1) ? user.Stats.ActivityStreak + 1 : 1;
            user.LastActiveDate = DateTime.UtcNow;
            await db.Users.UpdateOneAsync(x => x.Id == id, Builders<User>.Update.Set(x => x.LastActiveDate, user.LastActiveDate).Set(x => x.Stats.ActivityStreak, user.Stats.ActivityStreak), cancellationToken: ct);
        }

        var oid = ObjectId.Parse(id);
        user.Stats.TotalBookings = (int)await db.Collection<BsonDocument>("bookings").CountDocumentsAsync(new BsonDocument("userId", oid), cancellationToken: ct);
        user.Stats.TotalGroupsCreated = (int)await db.Collection<BsonDocument>("groupplays").CountDocumentsAsync(new BsonDocument { { "organizerId", oid }, { "status", new BsonDocument("$in", new BsonArray { "open", "full", "in_progress" }) } }, cancellationToken: ct);
        user.Stats.TotalGroupsJoined = (int)await db.Collection<BsonDocument>("groupplays").CountDocumentsAsync(new BsonDocument { { "participants.userId", oid }, { "organizerId", new BsonDocument("$ne", oid) } }, cancellationToken: ct);
        return user;
    }

    public async Task<PublicProfileResponse> PublicAsync(string id, CancellationToken ct)
    {
        var u = await GetAsync(id, ct);
        return new PublicProfileResponse(u.Id, u.DisplayName, u.Avatar, u.SkillLevel, u.Status, u.CreatedAt, new(u.Stats.Rating, u.Stats.ReviewCount, u.Stats.TotalGroupsCreated, u.Stats.TotalGroupsJoined, u.Stats.EloScore, u.Stats.ActivityStreak));
    }

    public async Task<User> UpdateAsync(string id, ProfileRequest input, CancellationToken ct)
    {
        var updates = ProfileValidator.Updates(input);
        if (updates.Count == 0)
            return await GetAsync(id, ct);
        updates.Add(Builders<User>.Update.Set(x => x.UpdatedAt, DateTime.UtcNow));
        return await db.Users.FindOneAndUpdateAsync(x => x.Id == Guard.Id(id), Builders<User>.Update.Combine(updates), new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound();
    }
}
