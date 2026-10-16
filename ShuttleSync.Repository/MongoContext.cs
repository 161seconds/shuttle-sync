using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;

namespace ShuttleSync.Repository;
public sealed partial class MongoContext
{
    public IMongoClient Client { get; }
    public IMongoDatabase Database { get; }

    static MongoContext()
    {
        ConventionRegistry.Register("ShuttleSync", new ConventionPack { new CamelCaseElementNameConvention(), new IgnoreExtraElementsConvention(true) }, type => type.Namespace?.StartsWith("ShuttleSync.Repository") == true);
    }

    public MongoContext(string connectionString, string? databaseName = null)
    {
        var url = new MongoUrl(connectionString);
        Client = new MongoClient(connectionString);
        Database = Client.GetDatabase(databaseName ?? url.DatabaseName ?? "shuttle_sync");
    }

    public IMongoCollection<T> Collection<T>(string name) => Database.GetCollection<T>(name);
}
