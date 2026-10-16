using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Social;
public static class SocialIndexes
{
    public static async Task EnsureIndexesAsync(MongoContext db, CancellationToken ct = default)
    {
        // Legacy pairs remain readable; only newly created pairs need the canonical key.
        await db.Friendships.Indexes.CreateOneAsync(new CreateIndexModel<Friendship>(Builders<Friendship>.IndexKeys.Ascending(f => f.PairKey), new CreateIndexOptions<Friendship> { Unique = true, PartialFilterExpression = new BsonDocument("pairKey", new BsonDocument("$type", "string")) }), cancellationToken: ct);
        await db.Conversations.Indexes.CreateOneAsync(new CreateIndexModel<Conversation>(Builders<Conversation>.IndexKeys.Ascending(c => c.PairKey), new CreateIndexOptions<Conversation> { Unique = true, PartialFilterExpression = new BsonDocument("pairKey", new BsonDocument("$type", "string")) }), cancellationToken: ct);
        await db.ChatMessages.Indexes.CreateOneAsync(new CreateIndexModel<ChatMessage>(Builders<ChatMessage>.IndexKeys.Ascending(m => m.GroupPlayId).Ascending(m => m.CreatedAt)), cancellationToken: ct);
        await db.Messages.Indexes.CreateOneAsync(new CreateIndexModel<Message>(Builders<Message>.IndexKeys.Ascending(m => m.ConversationId).Ascending(m => m.CreatedAt)), cancellationToken: ct);
    }
}
