using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace ShuttleSync.Repository.Entities;
public class SocialMember : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Avatar { get; set; }
    public string Role { get; set; } = "participant";
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool HasPaid { get; set; }
    public bool IsGuest { get; set; } = true;
    public string Gender { get; set; } = "male";
    public List<BeverageConsumption> BeveragesConsumed { get; set; } = [];
    public double TotalOwed { get; set; }
}

public class BeverageConsumption : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string BeverageId { get; set; } = "";
    public int Quantity { get; set; } = 1;
}

public class JoinRequest : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Avatar { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "pending";
    public string? RejectReason { get; set; }
}

public class GroupPlay : Entity
{
    public string Title { get; set; } = "";
    public string? Description { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string OrganizerId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string CourtId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string SubCourtId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string BookingId { get; set; } = "";
    public DateTime Date { get; set; }
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public string SportType { get; set; } = "badminton";
    public string SkillLevel { get; set; } = "all";
    public int MaxPlayers { get; set; }
    public int CurrentPlayers { get; set; } = 1;
    public double PricePerPlayer { get; set; }
    public PriceConfiguration? PriceConfig { get; set; }
    public List<MatchRecord> MatchRecords { get; set; } = [];
    public List<SocialMember> Participants { get; set; } = [];
    public List<JoinRequest> JoinRequests { get; set; } = [];
    public string Status { get; set; } = "open";
    public bool IsPublic { get; set; } = true;
    public string? Requirements { get; set; }
    public string? ContactInfo { get; set; }
    public bool IsChatDeleted { get; set; }
}

public class GenderFee
{
    public double Male { get; set; }
    public double Female { get; set; }
}

public class BasePrices
{
    public double Shuttlecock { get; set; } = 25000;
    public double CourtPerHour { get; set; } = 80000;
    public double BettingMatchFee { get; set; } = 20000;
}

public class Beverage : Entity
{
    public string Name { get; set; } = "";
    public double Price { get; set; }
}

public class BankInfo
{
    public string BankName { get; set; } = "";
    public string AccountNumber { get; set; } = "";
    public string AccountName { get; set; } = "";
}

public class PriceConfiguration
{
    public GenderFee GuestFee { get; set; } = new()
    {
        Male = 75000,
        Female = 65000
    };
    public GenderFee MemberFee { get; set; } = new()
    {
        Male = 65000,
        Female = 55000
    };
    public BasePrices BasePrices { get; set; } = new();
    public List<Beverage> Beverages { get; set; } = [];
    public BankInfo? BankInfo { get; set; }
}

public class MatchRecord : Entity
{
    public List<string> TeamA { get; set; } = [];
    public List<string> TeamB { get; set; } = [];
    public int ScoreA { get; set; }
    public int ScoreB { get; set; }
    public double BetAmount { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

public class Conversation : Entity
{
    [BsonIgnoreIfNull]
    public string? PairKey { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> Participants { get; set; } = [];

    [BsonRepresentation(BsonType.ObjectId)]
    public string? LastMessage { get; set; }
    public Dictionary<string, int> UnreadCount { get; set; } = [];

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> ArchivedBy { get; set; } = [];

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> DeletedBy { get; set; } = [];
}

public class MessageReply
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string MessageId { get; set; } = "";
    public string SenderName { get; set; } = "";
    public string Content { get; set; } = "";
}

public class ChatMessage : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string GroupPlayId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string SenderId { get; set; } = "";
    public string SenderName { get; set; } = "";
    public string? SenderAvatar { get; set; }
    public string Content { get; set; } = "";
    public MessageReply? ReplyTo { get; set; }
}

public class Message : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string ConversationId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string SenderId { get; set; } = "";
    public string? SenderName { get; set; }
    public string? SenderAvatar { get; set; }
    public string Content { get; set; } = "";
    public MessageReply? ReplyTo { get; set; }
    public bool IsRead { get; set; }
    public bool IsRecalled { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> DeletedBy { get; set; } = [];
}

public class Friendship : Entity
{
    [BsonIgnoreIfNull]
    public string? PairKey { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string RequesterId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string RecipientId { get; set; } = "";
    public string Status { get; set; } = "pending";
    public int RejectionCount { get; set; }
}

public class Tournament : Entity
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string OrganizerId { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string CourtId { get; set; } = "";
    public string SportType { get; set; } = "badminton";
    public string Format { get; set; } = "single_elimination";
    public string Status { get; set; } = "draft";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime RegistrationDeadline { get; set; }
    public int MaxTeams { get; set; }
    public int CurrentTeams { get; set; }
    public double EntryFee { get; set; }
    public List<TournamentPrize> Prizes { get; set; } = [];
    public string? Rules { get; set; }
    public string ContactInfo { get; set; } = "";
    public string? BannerImage { get; set; }
    public List<TournamentTeam> Teams { get; set; } = [];
    public List<TournamentMatch> Matches { get; set; } = [];
}

public class TournamentPrize
{
    public int Position { get; set; }
    public string Description { get; set; } = "";
    public double? Amount { get; set; }
}

public class TournamentTeam : Entity
{
    public string Name { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> Members { get; set; } = [];
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public bool HasPaid { get; set; }
    public int? Seed { get; set; }
}

public class TournamentMatch : Entity
{
    public int Round { get; set; }
    public int MatchNumber { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? Team1Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? Team2Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? WinnerId { get; set; }
    public int? Score1 { get; set; }
    public int? Score2 { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? CourtId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? SubCourtId { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
