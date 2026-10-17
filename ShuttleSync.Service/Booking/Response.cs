using MongoDB.Bson;
using System.Text.Json.Nodes;
using BookingEntity = ShuttleSync.Repository.Entities.Booking;

namespace ShuttleSync.Service.Booking;
public sealed record CreatedBookingResponse(string BookingCode, double FinalAmount, List<BookingEntity> Bookings, DateTime ExpiresAt, object? Notification);
public sealed record CourtBookingResponse([property: System.Text.Json.Serialization.JsonPropertyName("_id")] string Id, string SubCourtId, string StartTime, string EndTime, DateTime Date, string Status);

public static class BookingResponse
{
    public static JsonObject UserView(BsonDocument user)
    {
        var node = new JsonObject
        {
            ["_id"] = user["_id"].ToString()
        };
        foreach (var key in new[]
        {
            "displayName",
            "email",
            "phone",
            "avatar"
        }

        )
            if (user.TryGetValue(key, out var value) && !value.IsBsonNull)
                node[key] = value.ToString();
        return node;
    }
}
