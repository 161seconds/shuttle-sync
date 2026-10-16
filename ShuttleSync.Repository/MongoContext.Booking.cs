using MongoDB.Driver;
using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Repository;
public sealed partial class MongoContext
{
    public IMongoCollection<Booking> Bookings => Collection<Booking>("bookings");
    public IMongoCollection<Court> Courts => Collection<Court>("courts");
    public IMongoCollection<Venue> Venues => Collection<Venue>("venues");
    public IMongoCollection<TimeSlot> TimeSlots => Collection<TimeSlot>("timeslots");
    public IMongoCollection<Expense> Expenses => Collection<Expense>("expenses");
    public IMongoCollection<Voucher> Vouchers => Collection<Voucher>("vouchers");
}
