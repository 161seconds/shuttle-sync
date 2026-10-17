using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using static ShuttleSync.Service.Booking.BookingRules;

namespace ShuttleSync.Service.Booking.Validator;
public static class BookingValidator
{
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

    public static (DateTime? Start, DateTime? End) Filters(string? status, string? startDate, string? endDate)
    {
        if (status is not null && !BookingRules.Statuses.Contains(status))
            throw ApiException.BadRequest("Trạng thái không hợp lệ");
        var start = startDate is null ? (DateTime? )null : BookingRules.Date(startDate);
        var end = endDate is null ? (DateTime? )null : BookingRules.Date(endDate);
        if (start > end)
            throw ApiException.BadRequest("Ngày kết thúc phải từ ngày bắt đầu");
        return (start, end);
    }

    public static void Payment(PaymentTransaction payment)
    {
        Guard.Text(payment.Id, "Mã giao dịch", 200);
        BookingRules.Money(payment.Amount);
        if (payment.Amount <= 0)
            throw ApiException.BadRequest("Giao dịch không hợp lệ");
    }

    public static void CancelReason(string? reason)
    {
        if (reason?.Length > 500)
            throw ApiException.BadRequest("Lý do hủy không hợp lệ");
    }
}
