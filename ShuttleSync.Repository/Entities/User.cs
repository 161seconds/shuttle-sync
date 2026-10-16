using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace ShuttleSync.Repository.Entities;
public sealed class User : Entity
{
    public string Email { get; set; } = "";
    public string? Phone { get; set; }

    [JsonIgnore]
    public string? Password { get; set; }
    public string DisplayName { get; set; } = "";
    public string? Avatar { get; set; }
    public string Role { get; set; } = "user";
    public string Status { get; set; } = "active";
    public string AuthProvider { get; set; } = "local";
    public string? GoogleId { get; set; }
    public string? SkillLevel { get; set; }
    public List<string> SportPreferences { get; set; } = [];

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> FavoriteCourtIds { get; set; } = [];
    public UserStats Stats { get; set; } = new();
    public UserSettings Settings { get; set; } = new();
    public BanInfo? BanInfo { get; set; }

    [JsonIgnore]
    public List<string> RefreshTokens { get; set; } = [];

    [JsonIgnore]
    public int TokenVersion { get; set; }

    [JsonIgnore]
    public string? OtpCode { get; set; }

    [JsonIgnore]
    public DateTime? OtpExpires { get; set; }

    [JsonIgnore]
    public int OtpAttempts { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActiveDate { get; set; }
}

public sealed class UserStats
{
    public int TotalBookings { get; set; }
    public int TotalGroupsCreated { get; set; }
    public int TotalGroupsJoined { get; set; }
    public int TotalTournaments { get; set; }
    public int NoShowCount { get; set; }
    public double Rating { get; set; } = 5;
    public int ReviewCount { get; set; }
    public int EloScore { get; set; } = 1000;
    public int ActivityStreak { get; set; }
}

public sealed class UserSettings
{
    public bool Notifications { get; set; } = true;
    public bool EmailNotifications { get; set; } = true;
    public string Language { get; set; } = "vi";
    public string Theme { get; set; } = "light";
}

public sealed class BanInfo
{
    public string Reason { get; set; } = "";
    public DateTime BannedAt { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string BannedBy { get; set; } = "";
    public DateTime? ExpiresAt { get; set; }
}
