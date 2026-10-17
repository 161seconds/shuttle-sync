using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.Service.Owner.Validator;
public static class OwnerValidator
{
    public static void Venue(Venue venue, VenueRequest input, bool create)
    {
        if (create || input.Name is not null)
            venue.Name = Guard.Text(input.Name, "Tên cơ sở", 200);
        if (input.Location is not null)
        {
            var points = input.Location.Coordinates;
            if (input.Location.Type != "Point" || points.Length != 2 || !double.IsFinite(points[0]) || !double.IsFinite(points[1]) || points[0] is < -180 or > 180 || points[1] is < -90 or > 90)
                throw ApiException.BadRequest("Tọa độ không hợp lệ");
            venue.Location = input.Location;
        }

        if (input.Address is not null)
            venue.Address = input.Address;
        if (input.Contact is not null)
            venue.Contact = input.Contact;
        if (input.Sports is not null)
            venue.Sports = input.Sports.Select(BookingRules.Sport).Distinct().ToList();
        if (input.Images is not null)
        {
            if (input.Images.Count > 100 || input.Images.Any(i => i.Length > 4096 || !Uri.TryCreate(i, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")))
                throw ApiException.BadRequest("URL ảnh không hợp lệ");
            venue.Images = input.Images;
        }
    }

    public static void Expense(Expense row, ExpenseRequest input, bool create)
    {
        if (create && (!input.Amount.HasValue || input.Category is null || input.Date is null))
            throw ApiException.BadRequest("Thiếu thông tin chi phí");
        if (input.Amount.HasValue)
        {
            BookingRules.Money(input.Amount.Value);
            row.Amount = input.Amount.Value;
        }

        if (input.Category is not null)
        {
            if (!BookingRules.ExpenseCategories.Contains(input.Category))
                throw ApiException.BadRequest("Danh mục chi phí không hợp lệ");
            row.Category = input.Category;
        }

        if (input.Date is not null)
            row.Date = BookingRules.Date(input.Date);
        if (input.Description is not null)
        {
            if (input.Description.Length > 2000)
                throw ApiException.BadRequest("Mô tả quá dài");
            row.Description = input.Description.Trim();
        }
    }
}
