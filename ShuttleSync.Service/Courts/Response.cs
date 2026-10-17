using MongoDB.Bson;
using System.Text.Json.Nodes;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.Service.Courts;
public static class CourtResponse
{
    public static JsonObject Format(Venue venue, IReadOnlyList<Court> courts, BsonDocument? user)
    {
        var result = BookingRules.View(venue);
        result["id"] = venue.Id;
        var address = venue.Address;
        var full = string.Join(", ", new[] { address.Street, address.State, address.City, "Hồ Chí Minh" }.Where(s => !string.IsNullOrWhiteSpace(s)));
        BookingRules.Put(result, "address", new { street = address.Street, ward = address.State, district = address.City, city = "Hồ Chí Minh", fullAddress = full });
        result["fullAddress"] = full;
        BookingRules.Put(result, "sportTypes", venue.Sports.Select(s => s.ToLowerInvariant()));
        result["averageRating"] = venue.Rating.TotalScore;
        result["reviewCount"] = venue.Rating.ReviewsCount;
        result["status"] = venue.IsActive ? "active" : "closed";
        result["isVerified"] = true;
        result["totalBookings"] = 0;
        BookingRules.Put(result, "photos", venue.Images.Select((url, i) => new { url, isMain = i == 0, source = "google" }));
        BookingRules.Put(result, "amenities", Array.Empty<string>());
        BookingRules.Put(result, "courts", courts.Select(c =>
        {
            var view = BookingRules.View(c);
            view["sportType"] = c.SportType.ToLowerInvariant();
            return view;
        }));
        BookingRules.Put(result, "operatingHours", Enumerable.Range(0, 7).Select(day => new { dayOfWeek = day, open = "06:00", close = "22:00", isOpen = true }));
        BookingRules.Put(result, "pricePerHour", venue.Sports.DefaultIfEmpty("BADMINTON").Select(sport => new { sportType = sport.ToLowerInvariant(), timeSlots = new[] { new { pricePerHour = courts.Where(c => c.SportType == sport).Select(c => c.PricePerHour).DefaultIfEmpty(sport == "PICKLEBALL" ? 120000 : 80000).Min(), daysOfWeek = Enumerable.Range(0, 7), startTime = "00:00", endTime = "23:59" } } }));
        if (venue.OwnerId is not null)
        {
            result["ownerId"] = user is null ? null : BookingResponse.UserView(user);
        }

        return result;
    }
}
