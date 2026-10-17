using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.Service.Courts.Validator;
public static class CourtValidator
{
    public static void Apply(Court court, CourtRequest input, bool create)
    {
        if (create || input.Name is not null)
            court.Name = Guard.Text(input.Name, "Tên sân", 200);
        if (create || input.SportType is not null)
            court.SportType = BookingRules.Sport(input.SportType ?? "BADMINTON");
        if (input.SurfaceType is not null)
        {
            if (input.SurfaceType is not ("WOOD" or "SYNTHETIC" or "CONCRETE"))
                throw ApiException.BadRequest("Loại mặt sân không hợp lệ");
            court.SurfaceType = input.SurfaceType;
        }

        if (create && !input.PricePerHour.HasValue)
            throw ApiException.BadRequest("Thiếu giá sân");
        if (input.PricePerHour.HasValue)
        {
            BookingRules.Money(input.PricePerHour.Value);
            court.PricePerHour = input.PricePerHour.Value;
        }

        if (input.Status is not null)
        {
            court.Status = input.Status switch
            {
                "active" => "AVAILABLE",
                "inactive" => "MAINTENANCE",
                "AVAILABLE" or "MAINTENANCE" => input.Status,
                _ => throw ApiException.BadRequest("Trạng thái sân không hợp lệ")};
        }

        if (input.PricingConfigs is not null)
        {
            if (input.PricingConfigs.Count > 100)
                throw ApiException.BadRequest("Quá nhiều cấu hình giá");
            foreach (var rate in input.PricingConfigs)
            {
                BookingRules.Range(rate.StartTime, rate.EndTime);
                BookingRules.Money(rate.PricePerHour);
                if (rate.DaysOfWeek.Count == 0 || rate.DaysOfWeek.Any(d => d is < 0 or > 6))
                    throw ApiException.BadRequest("Thứ áp dụng không hợp lệ");
            }

            court.PricingConfigs = input.PricingConfigs;
        }
    }

    public static void Search(CourtSearchRequest input)
    {
        if (input.Lat.HasValue != input.Lng.HasValue || input.Lat is < -90 or > 90 || input.Lng is < -180 or > 180 || input.Radius is < .5 or > 50 || input.Lat.HasValue && (!double.IsFinite(input.Lat.Value) || !double.IsFinite(input.Lng!.Value)))
            throw ApiException.BadRequest("Tọa độ hoặc bán kính không hợp lệ");
        if (input.Date is not null)
            BookingRules.Date(input.Date);
        if (input.MinPrice.HasValue)
            BookingRules.Money(input.MinPrice.Value);
        if (input.MaxPrice.HasValue)
            BookingRules.Money(input.MaxPrice.Value);
        if (input.MinPrice > input.MaxPrice)
            throw ApiException.BadRequest("Khoảng giá không hợp lệ");
    }

    public static void Create(CreateCourtRequest input)
    {
        if (input.Courts.Count is < 1 or > 100)
            throw ApiException.BadRequest("Cần ít nhất một sân con");
        foreach (var child in input.Courts)
        {
            child.PricingConfigs ??= input.PricePerHour.FirstOrDefault(p => p.SportType.Equals(child.SportType, StringComparison.OrdinalIgnoreCase))?.TimeSlots ?? [];
            child.PricePerHour ??= child.PricingConfigs.FirstOrDefault()?.PricePerHour ?? (child.SportType?.Equals("pickleball", StringComparison.OrdinalIgnoreCase) == true ? 120000 : 80000);
        }
    }
}
