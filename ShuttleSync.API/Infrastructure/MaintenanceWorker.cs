using MongoDB.Bson;
using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.API.Infrastructure;
public sealed class MaintenanceWorker(IServiceScopeFactory scopes, ILogger<MaintenanceWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<MongoContext>();
                await scope.ServiceProvider.GetRequiredService<IBookingService>().CleanupExpiredAsync(stoppingToken);
                // Update only expired locks; a fresh lock can never be cleared by this cleanup.
                var slots = db.Database.GetCollection<BsonDocument>("timeslots");
                await slots.UpdateManyAsync(new BsonDocument { { "status", "selected" }, { "lockedAt", new BsonDocument("$lt", DateTime.UtcNow.AddMinutes(-5)) } }, new BsonDocument("$set", new BsonDocument { { "status", "available" }, { "lockedBy", BsonNull.Value }, { "lockedAt", BsonNull.Value } }), cancellationToken: stoppingToken);
                await slots.DeleteManyAsync(new BsonDocument { { "date", new BsonDocument("$lt", DateTime.UtcNow.AddDays(-30)) }, { "status", new BsonDocument("$in", new BsonArray { "available", "expired" }) } }, stoppingToken);
                var oldGroups = await db.GroupPlays.Find(g => g.CreatedAt < DateTime.UtcNow.AddDays(-14) && !g.IsChatDeleted).Project(g => g.Id).ToListAsync(stoppingToken);
                if (oldGroups.Count > 0)
                {
                    using var session = await db.Client.StartSessionAsync(cancellationToken: stoppingToken);
                    await session.WithTransactionAsync(async (s, ct) =>
                    {
                        await db.ChatMessages.DeleteManyAsync(s, m => oldGroups.Contains(m.GroupPlayId), cancellationToken: ct);
                        await db.GroupPlays.UpdateManyAsync(s, g => oldGroups.Contains(g.Id), Builders<GroupPlay>.Update.Set(g => g.IsChatDeleted, true), cancellationToken: ct);
                        return true;
                    }, cancellationToken: stoppingToken);
                }
            }
            catch (OperationCanceledException)when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception error)
            {
                logger.LogError(error, "Scheduled cleanup failed");
            }
        }
    }
}
