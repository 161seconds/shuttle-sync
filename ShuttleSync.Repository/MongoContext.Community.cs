using MongoDB.Driver;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Repository;
public sealed partial class MongoContext
{
    public IMongoCollection<Review> Reviews => Collection<Review>("reviews");
    public IMongoCollection<OwnerApplication> OwnerApplications => Collection<OwnerApplication>("ownerapplications");
    public IMongoCollection<Report> Reports => Collection<Report>("reports");
    public IMongoCollection<Event> Events => Collection<Event>("events");
    public IMongoCollection<Notification> Notifications => Collection<Notification>("notifications");
}
