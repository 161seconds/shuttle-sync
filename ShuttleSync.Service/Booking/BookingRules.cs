using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Booking;
public static class BookingRules
{
    public static readonly string[] Sports = ["BADMINTON", "PICKLEBALL", "TENNIS"];
    public static readonly string[] Statuses = ["pending_payment", "confirmed", "completed", "cancelled", "no_show"];
    public static readonly string[] ExpenseCategories = ["Mặt bằng", "Điện Nước", "Nhân sự", "Bảo trì", "Marketing", "Khác"];
    public static DateTime Today => DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7).Date, DateTimeKind.Utc);

    public static DateTime Date(string? value)
    {
        if (!DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            throw ApiException.BadRequest("Ngày không hợp lệ");
        return DateTime.SpecifyKind(date, DateTimeKind.Utc);
    }

    public static int Minutes(string? value)
    {
        if (value is null || value.Length != 5 || value[2] != ':' || !char.IsAsciiDigit(value[0]) || !char.IsAsciiDigit(value[1]) || !char.IsAsciiDigit(value[3]) || !char.IsAsciiDigit(value[4]) || !int.TryParse(value[..2], out var h) || !int.TryParse(value[3..], out var m) || h is < 0 or > 23 || m is not (0 or 30))
            throw ApiException.BadRequest("Giờ phải theo mốc 30 phút");
        return h * 60 + m;
    }

    public static void Range(string start, string end)
    {
        if (Minutes(end) <= Minutes(start))
            throw ApiException.BadRequest("Giờ kết thúc phải lớn hơn giờ bắt đầu");
    }

    public static void Money(double amount)
    {
        if (!double.IsFinite(amount) || amount < 0)
            throw ApiException.BadRequest("Số tiền không hợp lệ");
    }

    public static string Sport(string value)
    {
        value = value.ToUpperInvariant();
        if (!Sports.Contains(value))
            throw ApiException.BadRequest("Môn thể thao không hợp lệ");
        return value;
    }

    public static List<DateTime> Dates(CreateBookingRequest input)
    {
        Guard.Id(input.CourtId);
        Guard.Id(input.SubCourtId);
        Range(input.StartTime, input.EndTime);
        var date = Date(input.Date);
        if (date < Today)
            throw ApiException.BadRequest("Không thể đặt sân trong quá khứ");
        if (input.Type is "casual" or "group_play" or "tournament")
            return[date];
        if (input.Type != "fixed" || input.Months is null or < 1 or > 12 || input.DaysOfWeek is not { Count: > 0 and <= 7 } days || days.Distinct().Count() != days.Count || days.Any(d => d is < 0 or > 6))
            throw ApiException.BadRequest("Gói cố định không hợp lệ");
        return days.SelectMany(day => Enumerable.Range(0, input.Months.Value * 4).Select(week => date.AddDays((day - (int)date.DayOfWeek + 7) % 7 + week * 7))).Order().ToList();
    }

    public static double Price(Court court, DateTime date, string start, string end)
    {
        Range(start, end);
        double sum = 0;
        for (var minute = Minutes(start); minute < Minutes(end); minute += 30)
        {
            var rate = court.PricingConfigs.FirstOrDefault(c => c.DaysOfWeek.Contains((int)date.DayOfWeek) && minute >= Minutes(c.StartTime) && minute < Minutes(c.EndTime));
            var price = rate?.PricePerHour ?? court.PricePerHour;
            Money(price);
            sum += price / 2;
        }

        return sum;
    }

    public static JsonObject View(object value) => JsonSerializer.SerializeToNode(value, new JsonSerializerOptions(JsonSerializerDefaults.Web))!.AsObject();
    public static void Put(JsonObject value, string key, object? data) => value[key] = JsonSerializer.SerializeToNode(data, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    public static bool Overlaps(string start, string end, string otherStart, string otherEnd) => string.CompareOrdinal(start, otherEnd) < 0 && string.CompareOrdinal(end, otherStart) > 0;
}
