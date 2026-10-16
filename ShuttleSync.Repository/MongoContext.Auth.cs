using MongoDB.Driver;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Repository;
public sealed partial class MongoContext
{
    public IMongoCollection<User> Users => Collection<User>("users");
}
