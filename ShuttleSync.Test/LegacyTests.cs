using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Test;
public static class LegacyTests
{
    static readonly ObjectId UserId = ObjectId.GenerateNewId();
    static readonly ObjectId VenueId = ObjectId.GenerateNewId();
    static readonly ObjectId CourtId = ObjectId.GenerateNewId();
    static readonly ObjectId ApplicationId = ObjectId.GenerateNewId();
    static readonly ObjectId EventId = ObjectId.GenerateNewId();
    static readonly ObjectId ReviewId = ObjectId.GenerateNewId();
    static readonly DateTime Created = new(2025, 1, 2, 3, 4, 5, DateTimeKind.Utc);
    public static async Task PrepareAsync(MongoContext db)
    {
        await Index(db, "users", new("email", 1), unique: true);
        await Index(db, "users", new("displayName", "text"));
        await Index(db, "venues", new("location", "2dsphere"));
        await Index(db, "venues", new("name", "text"));
        await Index(db, "courts", new() { { "venueId", 1 }, { "status", 1 } });
        await Index(db, "ownerapplications", new("userId", 1));
        await Index(db, "ownerapplications", new("status", 1));
        await Index(db, "events", new("voucher.code", 1), unique: true, sparse: true);
        await Index(db, "events", new() { { "startDate", 1 }, { "endDate", 1 }, { "isActive", 1 } });
        await Index(db, "reviews", new("bookingId", 1), unique: true);
        await Index(db, "reviews", new() { { "userId", 1 }, { "courtId", 1 } }, unique: true);
        await Insert(db, "users", UserId, new() { { "email", $"legacy-{UserId}@example.test" }, { "displayName", "Legacy Player" }, { "password", BCrypt.Net.BCrypt.HashPassword("LegacyPass123", 4) }, { "role", "user" }, { "status", "active" }, { "tokenVersion", 0 }, { "favoriteCourtIds", new BsonArray { VenueId } }, { "stats", new BsonDocument { { "rating", 4.5 }, { "totalBookings", 3 } } }, { "settings", new BsonDocument { { "language", "vi" }, { "notifications", true } } } });
        await Insert(db, "venues", VenueId, new() { { "name", "Legacy Venue" }, { "ownerId", UserId }, { "googlePlaceId", BsonNull.Value }, { "location", new BsonDocument { { "type", "Point" }, { "coordinates", new BsonArray { 106.7, 10.8 } } } }, { "sports", new BsonArray { "BADMINTON" } }, { "rating", new BsonDocument { { "totalScore", 9 }, { "reviewsCount", 2 } } }, { "isActive", true } });
        await Insert(db, "courts", CourtId, new() { { "venueId", VenueId }, { "name", "Legacy Court" }, { "sportType", "BADMINTON" }, { "pricePerHour", 120000 }, { "status", "AVAILABLE" }, { "pricingConfigs", new BsonArray { new BsonDocument { { "startTime", "18:00" }, { "endTime", "22:00" }, { "daysOfWeek", new BsonArray { 1, 2 } }, { "pricePerHour", 150000 } } } } });
        await Insert(db, "ownerapplications", ApplicationId, new() { { "userId", UserId }, { "courtName", "Legacy Application" }, { "status", "rejected" }, { "courtAddress", new BsonDocument { { "street", "Legacy Street" }, { "ward", "Ward" }, { "district", "District" }, { "city", "HCM" }, { "fullAddress", "Legacy Address" } } }, { "courtLocation", new BsonDocument { { "lat", 10.8 }, { "lng", 106.7 } } }, { "sportTypes", new BsonArray { "badminton" } }, { "identityDocument", "legacy.pdf" } });
        await Insert(db, "events", EventId, new() { { "title", "Legacy Event" }, { "description", "Existing event" }, { "type", "voucher" }, { "createdBy", UserId }, { "startDate", Created }, { "endDate", Created.AddYears(10) }, { "voucher", new BsonDocument { { "code", $"LEGACY-{EventId}" }, { "type", "percentage" }, { "value", 10 }, { "usageLimit", 100 }, { "usedCount", 2 }, { "expiresAt", Created.AddYears(10) }, { "applicableCourtIds", new BsonArray { VenueId } } } } });
        await Insert(db, "reviews", ReviewId, new() { { "userId", UserId }, { "courtId", VenueId }, { "bookingId", ObjectId.GenerateNewId() }, { "rating", 4 }, { "comment", "Legacy review" }, { "reply", new BsonDocument { { "userId", UserId }, { "comment", "Legacy reply" }, { "repliedAt", Created } } } });
    }

    public static async Task RunAsync(MongoContext db)
    {
        var user = await db.Users.Find(x => x.Id == UserId.ToString()).FirstAsync();
        Assert.True(user.Version == 7 && user.CreatedAt == Created && user.FavoriteCourtIds.Single() == VenueId.ToString(), "Mongoose user ObjectId references, dates and __v deserialize");
        Assert.True(user.Stats.Rating == 4.5 && user.Settings.Language == "vi" && BCrypt.Net.BCrypt.Verify("LegacyPass123", user.Password), "Mongoose nested user values and bcrypt hash survive");
        var venue = await db.Collection<Venue>("venues").Find(x => x.Id == VenueId.ToString()).FirstAsync();
        Assert.True(venue.OwnerId == user.Id && venue.Location.Coordinates.SequenceEqual(new[] { 106.7, 10.8 }) && venue.Rating.TotalScore == 9, "Mongoose venue GeoJSON, references and numeric values deserialize");
        var court = await db.Collection<Court>("courts").Find(x => x.Id == CourtId.ToString()).FirstAsync();
        Assert.True(court.VenueId == venue.Id && court.PricePerHour == 120000 && court.PricingConfigs.Single().DaysOfWeek.SequenceEqual(new[] { 1, 2 }), "Mongoose court pricing arrays deserialize");
        var application = await db.OwnerApplications.Find(x => x.Id == ApplicationId.ToString()).FirstAsync();
        var item = await db.Events.Find(x => x.Id == EventId.ToString()).FirstAsync();
        var review = await db.Reviews.Find(x => x.Id == ReviewId.ToString()).FirstAsync();
        Assert.True(application.CourtLocation.Lat == 10.8 && item.Voucher!.ApplicableCourtIds.Single() == venue.Id && review.Reply!.RepliedAt == Created, "Mongoose community nested documents deserialize");
        await RoundTrip(db, "users", user);
        await RoundTrip(db, "venues", venue);
        await RoundTrip(db, "courts", court);
        await RoundTrip(db, "ownerapplications", application);
        await RoundTrip(db, "events", item);
        await RoundTrip(db, "reviews", review);
        foreach (var collection in new[]
        {
            "ownerapplications",
            "events"
        }

        )
        {
            var indexes = await (await db.Collection<BsonDocument>(collection).Indexes.ListAsync()).ToListAsync();
            Assert.True(indexes.Any(x => x["name"] == (collection == "events" ? "voucher.code_1" : "userId_1")), $"legacy {collection} index retained alongside new safety index");
        }
    }

    static Task Index(MongoContext db, string collection, BsonDocument keys, bool unique = false, bool sparse = false) => db.Collection<BsonDocument>(collection).Indexes.CreateOneAsync(new CreateIndexModel<BsonDocument>(keys, new CreateIndexOptions { Unique = unique, Sparse = sparse }));
    static Task Insert(MongoContext db, string collection, ObjectId id, BsonDocument value)
    {
        value.Add("_id", id).Add("createdAt", Created).Add("updatedAt", Created).Add("__v", 7).Add("legacyUnknown", new BsonDocument("keep", new BsonArray { "untouched", 42 }));
        return db.Collection<BsonDocument>(collection).InsertOneAsync(value);
    }

    static async Task RoundTrip<T>(MongoContext db, string collection, T entity)
        where T : Entity
    {
        Assert.True(entity.ExtraElements.Contains("legacyUnknown"), $"{collection} captures unrecognized BSON fields");
        await db.Collection<T>(collection).ReplaceOneAsync(x => x.Id == entity.Id, entity);
        var raw = await db.Collection<BsonDocument>(collection).Find(new BsonDocument("_id", ObjectId.Parse(entity.Id))).FirstAsync();
        Assert.True(raw["legacyUnknown"]["keep"].AsBsonArray.SequenceEqual(new BsonArray { "untouched", 42 }) && raw["__v"] == 7, $"{collection} typed replacement preserves unknown fields and __v");
    }
}
