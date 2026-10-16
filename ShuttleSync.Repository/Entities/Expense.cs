using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShuttleSync.Repository.Entities;
public sealed class Expense : Entity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string VenueId { get; set; } = "";
    public double Amount { get; set; }
    public string Category { get; set; } = "";
    public DateTime Date { get; set; }
    public string Description { get; set; } = "";
}
