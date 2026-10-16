using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace ShuttleSync.Repository.Entities;
[BsonIgnoreExtraElements(Inherited = true)]
public abstract class Entity
{
    [BsonExtraElements, JsonIgnore]
    public BsonDocument ExtraElements { get; set; } = new();

    [BsonId, BsonRepresentation(BsonType.ObjectId), JsonPropertyName("_id")]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("__v"), JsonPropertyName("__v")]
    public int Version { get; set; }
}
