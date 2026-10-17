using System.Text.Json;
using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Account.Validator;
public static class ProfileValidator
{
    public static List<UpdateDefinition<User>> Updates(ProfileRequest request)
    {
        var input = request.Fields;
        var updates = new List<UpdateDefinition<User>>();
        foreach (var field in new[] { "displayName", "phone", "skillLevel" })
            if (input.TryGetValue(field, out var text) && text.ValueKind != JsonValueKind.String)
                throw ApiException.BadRequest("Thông tin hồ sơ không hợp lệ");
        if (input.TryGetValue("avatar", out var image) && image.ValueKind is not (JsonValueKind.String or JsonValueKind.Null))
            throw ApiException.BadRequest("Ảnh đại diện không hợp lệ");
        if (input.TryGetValue("sportPreferences", out var preferences) &&
            (preferences.ValueKind != JsonValueKind.Array || preferences.EnumerateArray().Any(x => x.ValueKind != JsonValueKind.String)))
            throw ApiException.BadRequest("Môn thể thao không hợp lệ");
        if (input.TryGetValue("settings", out var configuration))
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
        if (input.TryGetValue("displayName", out var name))
            updates.Add(Builders<User>.Update.Set(x => x.DisplayName, Guard.Text(name.GetString(), "DisplayName", 50, 2)));
        if (input.TryGetValue("phone", out var phone))
        {
            var value = phone.GetString();
            if (value is null || !System.Text.RegularExpressions.Regex.IsMatch(value, @"^(0|\+84)\d{9}$"))
                throw ApiException.BadRequest("Số điện thoại không hợp lệ");
            updates.Add(Builders<User>.Update.Set(x => x.Phone, value));
        }

        if (input.TryGetValue("avatar", out var avatar))
            updates.Add(Builders<User>.Update.Set(x => x.Avatar, avatar.GetString()));
        if (input.TryGetValue("skillLevel", out var skill))
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

        if (input.TryGetValue("sportPreferences", out var sports))
        {
            var values = sports.EnumerateArray().Select(x => x.GetString() ?? "").ToList();
            if (values.Any(x => !new[] { "badminton", "pickleball" }.Contains(x)))
                throw ApiException.BadRequest("Môn thể thao không hợp lệ");
            updates.Add(Builders<User>.Update.Set(x => x.SportPreferences, values));
        }

        if (input.TryGetValue("settings", out var settings))
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

        return updates;
    }
}
