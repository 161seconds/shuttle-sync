using ShuttleSync.Service.Owner;
using ShuttleSync.Service.Courts;
using ShuttleSync.Service.Vouchers;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Booking;
using ShuttleSync.Service.Exceptions;
using BookingEntity = ShuttleSync.Repository.Entities.Booking;

namespace ShuttleSync.Test;
public static class BookingTests
{
    public static async Task RunAsync(MongoContext db, IServiceProvider services)
    {
        var bookings = services.GetRequiredService<IBookingService>();
        var owners = services.GetRequiredService<IOwnerService>();
        var vouchers = services.GetRequiredService<IVoucherService>();
        var courtsService = services.GetRequiredService<ICourtService>();
        var owner = ObjectId.GenerateNewId().ToString();
        var user = ObjectId.GenerateNewId().ToString();
        var venue = new Venue
        {
            OwnerId = owner,
            Name = "Booking checks",
            Sports = ["BADMINTON"]
        };
        await db.Venues.InsertOneAsync(venue);
        var courts = Enumerable.Range(0, 9).Select(i => new Court { VenueId = venue.Id, Name = "Court " + i, PricePerHour = 100000 }).ToList();
        await db.Courts.InsertManyAsync(courts);
        var date = BookingRules.Today.AddDays(2).ToString("yyyy-MM-dd");
        CreateBookingRequest Input(int court = 0) => new()
        {
            CourtId = venue.Id,
            SubCourtId = courts[court].Id,
            Date = date,
            StartTime = "08:00",
            EndTime = "09:00"
        };
        async Task<BookingEntity> Create(int court, string customer)
        {
            var result = JsonSerializer.SerializeToElement(await bookings.CreateAsync(customer, Input(court)), new JsonSerializerOptions(JsonSerializerDefaults.Web));
            return await db.Bookings.AsQueryable().FirstAsync(b => b.BookingCode == result.GetProperty("bookingCode").GetString());
        }

        await TestAssert.ThrowsAsync<ApiException>(() => bookings.CreateAsync(user, new() { CourtId = venue.Id, SubCourtId = courts[0].Id, Date = date, StartTime = "08:15", EndTime = "09:00" }), "booking rejects unaligned half-hour range");
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.CreateAsync(user, new() { CourtId = venue.Id, SubCourtId = courts[0].Id, Date = date, StartTime = "08:00", EndTime = "09:00", Type = "fixed", Months = 1, DaysOfWeek = [7] }), "fixed booking rejects invalid weekday without looping");
        var wrong = Input();
        wrong.CourtId = ObjectId.GenerateNewId().ToString();
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.CreateAsync(user, wrong), "booking rejects mismatched venue and child court");
        var race = await Task.WhenAll(Enumerable.Range(0, 5).Select(async _ =>
        {
            try
            {
                await Create(0, ObjectId.GenerateNewId().ToString());
                return true;
            }
            catch (ApiException e)when (e.StatusCode == 409)
            {
                return false;
            }
        }));
        Assert.True(race.Count(x => x) == 1, "five competing transactions produce exactly one booking");
        var mixed = await Task.WhenAll(new[] { Attempt(() => Create(1, user)), Attempt(() => owners.BlockAsync(owner, new() { SubCourtId = courts[1].Id, Date = date, StartTime = "08:00", EndTime = "09:00" })) });
        Assert.True(mixed.Count(x => x) == 1, "owner block and customer booking share the same court guard");
        var schedule = JsonSerializer.SerializeToElement(await owners.ScheduleAsync(owner, date), new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.True(schedule.GetProperty("bookings").EnumerateArray().All(b => b.GetProperty("subCourtId").ValueKind == JsonValueKind.String), "owner schedule preserves string child court IDs");
        var a = await Create(2, user);
        var b = await Create(3, user);
        await TestAssert.ThrowsAsync<ApiException>(() => owners.UpdateBookingAsync(owner, b.Id, new() { SubCourtId = courts[2].Id }), "reschedule rejects an occupied target");
        await bookings.ConfirmAsync(a.BookingCode, new("BOOKING_CHECK_PAYMENT", a.FinalAmount));
        var paid = await db.Bookings.AsQueryable().FirstAsync(x => x.Id == a.Id);
        Assert.True(paid.Payment.Status == "paid" && paid.Status == "confirmed", "verified sufficient payment confirms booking");
        await bookings.ConfirmAsync(a.BookingCode, new("BOOKING_CHECK_PAYMENT", a.FinalAmount));
        Assert.True(await db.Bookings.AsQueryable().CountAsync(x => x.Payment.TransactionId == "BOOKING_CHECK_PAYMENT") == 1, "duplicate bank transaction remains idempotent");
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.ConfirmAsync(b.BookingCode, new("BOOKING_CHECK_PAYMENT", b.FinalAmount)), "bank transaction cannot be replayed on another booking");
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.ConfirmAsync(b.BookingCode, new("BOOKING_CHECK_UNDERPAID", 1)), "underpayment does not confirm booking");
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.CancelAsync(a.Id, user, "cancel"), "paid booking does not silently issue fake refund");
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.CancelAsync(b.Id, ObjectId.GenerateNewId().ToString(), null), "booking cancellation checks ownership");
        var expired = await Create(4, user);
        await db.Bookings.UpdateOneAsync(x => x.Id == expired.Id, Builders<BookingEntity>.Update.Set(x => x.Payment.ExpiresAt, DateTime.UtcNow.AddMinutes(-1)));
        Assert.True(await bookings.CleanupExpiredAsync() >= 1, "cleanup cancels expired unpaid reservations");
        var replacement = await Create(4, ObjectId.GenerateNewId().ToString());
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.ConfirmAsync(expired.BookingCode, new("BOOKING_CHECK_LATE", 100000)), "late transfer cannot revive cancelled booking over replacement");
        var fixedInput = Input(5);
        fixedInput.Type = "fixed";
        fixedInput.Months = 1;
        fixedInput.DaysOfWeek = [(int)BookingRules.Date(date).DayOfWeek];
        var voucher = new Voucher
        {
            Code = "BOOKING_CHECK_FIXED",
            OwnerId = owner,
            DiscountType = "fixed",
            DiscountValue = 50000,
            UsageLimit = 1,
            Status = "APPROVED",
            StartDate = DateTime.UtcNow.AddDays(-1),
            EndDate = DateTime.UtcNow.AddDays(30)
        };
        await db.Vouchers.InsertOneAsync(voucher);
        fixedInput.VoucherCode = voucher.Code;
        var groupResult = JsonSerializer.SerializeToElement(await bookings.CreateAsync(user, fixedInput), new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var groupCode = groupResult.GetProperty("bookingCode").GetString()!;
        var group = await bookings.ByCodeAsync(groupCode, user);
        Assert.True(group.Count == 4 && group.Sum(x => x.Discount) == 50000 && group.All(x => x.FinalAmount >= 0), "fixed booking applies bounded voucher across all sessions");
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.ConfirmAsync(groupCode, new("BOOKING_CHECK_GROUP_SHORT", group[0].FinalAmount)), "group payment validates the entire group total");
        await bookings.ConfirmAsync(groupCode, new("BOOKING_CHECK_GROUP", group.Sum(x => x.FinalAmount)));
        Assert.True(await db.Bookings.AsQueryable().CountAsync(x => x.GroupId == groupCode && x.Payment.Status == "paid") == 4, "group payment commits every session atomically");
        Assert.True(await db.Vouchers.AsQueryable().CountAsync(v => v.Id == voucher.Id && v.UsedCount == 1) == 1, "voucher usage increments once for the complete group");
        var rejected = Input(6);
        rejected.VoucherCode = voucher.Code;
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.CreateAsync(user, rejected), "exhausted voucher fails reservation atomically");
        Assert.True(!await db.Bookings.AsQueryable().AnyAsync(x => x.SubCourtId == courts[6].Id), "failed voucher leaves no booking behind");
        var current = new BookingEntity
        {
            BookingCode = "CHECK_PAST_REVENUE",
            UserId = user,
            CourtId = venue.Id,
            SubCourtId = courts[7].Id,
            Date = BookingRules.Today.AddDays(-1).AddHours(12),
            StartTime = "08:00",
            EndTime = "09:00",
            TotalAmount = 100000,
            FinalAmount = 100000,
            Status = "confirmed",
            Payment = new()
            {
                Status = "paid",
                ExpiresAt = DateTime.UtcNow.AddDays(-1)
            }
        };
        await db.Bookings.InsertOneAsync(current);
        var statsBefore = JsonSerializer.SerializeToElement(await owners.StatsAsync(owner)).GetProperty("totalRevenue").GetDouble();
        var history = await bookings.MineAsync(user, null, current.Date.ToString("yyyy-MM-dd"), current.Date.ToString("yyyy-MM-dd"));
        Assert.True(history.Any(x => x["_id"]!.GetValue<string>() == current.Id), "inclusive history end date includes afternoon reservations");
        var statsAfter = JsonSerializer.SerializeToElement(await owners.StatsAsync(owner)).GetProperty("totalRevenue").GetDouble();
        Assert.True(statsBefore == statsAfter && statsAfter >= 100000, "completed bookings retain already-paid owner revenue");
        await TestAssert.ThrowsAsync<ApiException>(() => bookings.MineAsync(user, null, "2099-01-02", "2099-01-01"), "history rejects reversed date range");
        var slots = JsonSerializer.SerializeToElement(await courtsService.SlotsAsync(venue.Id, courts[2].Id, date), new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.True(slots.EnumerateArray().Any(x => x.GetProperty("startTime").GetString() == "08:00" && x.GetProperty("status").GetString() == "booked"), "slot API overlays real bookings");
        await TestAssert.ThrowsAsync<ApiException>(() => owners.BlockAsync(owner, new() { SubCourtId = courts[2].Id, Date = date, StartTime = "08:00", EndTime = "09:00" }), "owner cannot double-block an occupied slot");
    }

    private static async Task<bool> Attempt<T>(Func<Task<T>> action)
    {
        try
        {
            await action();
            return true;
        }
        catch (ApiException e)when (e.StatusCode == 409)
        {
            return false;
        }
    }
}
