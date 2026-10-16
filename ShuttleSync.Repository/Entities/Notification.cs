using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class Notification : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public string Type { get; set; } = "system";
    public string? Link { get; set; }
    public BsonDocument? Data { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
