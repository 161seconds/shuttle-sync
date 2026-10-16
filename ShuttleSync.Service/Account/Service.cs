using System.Text.Json;
using System.Text.Json.Nodes;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Account;
public sealed class Service(MongoContext db)
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

    public async Task<object> PublicAsync(string id, CancellationToken ct)
    {
        var u = await GetAsync(id, ct);
        return new
        {
            _id = u.Id,
            u.DisplayName,
            u.Avatar,
            u.SkillLevel,
            u.Status,
            joinedDate = u.CreatedAt,
            stats = new
            {
                u.Stats.Rating,
                u.Stats.ReviewCount,
                u.Stats.TotalGroupsCreated,
                u.Stats.TotalGroupsJoined,
                u.Stats.EloScore,
                u.Stats.ActivityStreak
            }
        };
    }

    public async Task<User> UpdateAsync(string id, JsonElement input, CancellationToken ct)
    {
        var updates = new List<UpdateDefinition<User>>();
        if (input.ValueKind != JsonValueKind.Object)
            throw ApiException.BadRequest("Thông tin hồ sơ không hợp lệ");
        foreach (var field in new[] { "displayName", "phone", "skillLevel" })
            if (input.TryGetProperty(field, out var text) && text.ValueKind != JsonValueKind.String)
                throw ApiException.BadRequest("Thông tin hồ sơ không hợp lệ");
        if (input.TryGetProperty("avatar", out var image) && image.ValueKind is not (JsonValueKind.String or JsonValueKind.Null))
            throw ApiException.BadRequest("Ảnh đại diện không hợp lệ");
        if (input.TryGetProperty("sportPreferences", out var preferences) &&
            (preferences.ValueKind != JsonValueKind.Array || preferences.EnumerateArray().Any(x => x.ValueKind != JsonValueKind.String)))
            throw ApiException.BadRequest("Môn thể thao không hợp lệ");
        if (input.TryGetProperty("settings", out var configuration))
        {
            if (configuration.ValueKind != JsonValueKind.Object)
                throw ApiException.BadRequest("Cài đặt không hợp lệ");
            foreach (var field in new[] { "notifications", "emailNotifications", "language", "theme" })
                if (configuration.TryGetProperty(field, out var value) &&
                    (field is "notifications" or "emailNotifications"
                        ? value.ValueKind is not (JsonValueKind.True or JsonValueKind.False)
                        : value.ValueKind != JsonValueKind.String))
                    throw ApiException.BadRequest("Cài đặt không hợp lệ");
        }
        if (input.TryGetProperty("displayName", out var name))
            updates.Add(Builders<User>.Update.Set(x => x.DisplayName, Guard.Text(name.GetString(), "DisplayName", 50, 2)));
        if (input.TryGetProperty("phone", out var phone))
        {
            var value = phone.GetString();
            if (value is null || !System.Text.RegularExpressions.Regex.IsMatch(value, @"^(0|\+84)\d{9}$"))
                throw ApiException.BadRequest("Số điện thoại không hợp lệ");
            updates.Add(Builders<User>.Update.Set(x => x.Phone, value));
        }

        if (input.TryGetProperty("avatar", out var avatar))
            updates.Add(Builders<User>.Update.Set(x => x.Avatar, avatar.GetString()));
        if (input.TryGetProperty("skillLevel", out var skill))
        {
            var value = skill.GetString();
            if (!new[]
            {
                "y",
                "y_minus",
                "y_plus",
                "tby_minus",
                "tby",
                "tby_plus",
                "tb_minus",
                "tb",
                "tb_plus",
                "tb_plus_2",
                "tb_plus_3",
                "tbk",
                "bc",
                "cn"
            }.Contains(value))
                throw ApiException.BadRequest("Trình độ không hợp lệ");
            updates.Add(Builders<User>.Update.Set(x => x.SkillLevel, value));
        }

        if (input.TryGetProperty("sportPreferences", out var sports))
        {
            var values = sports.EnumerateArray().Select(x => x.GetString() ?? "").ToList();
            if (values.Any(x => !new[] { "badminton", "pickleball" }.Contains(x)))
                throw ApiException.BadRequest("Môn thể thao không hợp lệ");
            updates.Add(Builders<User>.Update.Set(x => x.SportPreferences, values));
        }

        if (input.TryGetProperty("settings", out var settings))
        {
            foreach (var key in new[]
            {
                "notifications",
                "emailNotifications",
                "language",
                "theme"
            }

            )
                if (settings.TryGetProperty(key, out var value))
                {
                    BsonValue bson;
                    if (key is "notifications" or "emailNotifications")
                        bson = value.GetBoolean();
                    else
                    {
                        var text = value.GetString();
                        if (!(key == "language" ? new[]
                        {
                            "vi",
                            "en"
                        }

                        : new[]
                        {
                            "light",
                            "dark"
                        }

                        ).Contains(text))
                            throw ApiException.BadRequest("Cài đặt không hợp lệ");
                        bson = text;
                    }

                    updates.Add(new BsonDocument("$set", new BsonDocument("settings." + key, bson)));
                }
        }

        if (updates.Count == 0)
            return await GetAsync(id, ct);
        updates.Add(Builders<User>.Update.Set(x => x.UpdatedAt, DateTime.UtcNow));
        return await db.Users.FindOneAndUpdateAsync(x => x.Id == Guard.Id(id), Builders<User>.Update.Combine(updates), new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After }, ct) ?? throw ApiException.NotFound();
    }
}
