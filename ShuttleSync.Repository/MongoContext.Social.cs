using MongoDB.Driver;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Repository;
public sealed partial class MongoContext
{
    public IMongoCollection<GroupPlay> GroupPlays => Collection<GroupPlay>("groupplays");
    public IMongoCollection<Tournament> Tournaments => Collection<Tournament>("tournaments");
    public IMongoCollection<Conversation> Conversations => Collection<Conversation>("conversations");
    public IMongoCollection<Message> Messages => Collection<Message>("messages");
    public IMongoCollection<ChatMessage> ChatMessages => Collection<ChatMessage>("chatmessages");
    public IMongoCollection<Friendship> Friendships => Collection<Friendship>("friendships");
}
