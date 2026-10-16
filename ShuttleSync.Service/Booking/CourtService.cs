using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Booking;
public sealed class CourtService(MongoContext db, BookingService bookings, OwnerService owners)
{
    public async Task<JsonObject> FormatAsync(Venue venue, IReadOnlyList<Court> courts, CancellationToken ct = default)
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
            var user = await db.Collection<BsonDocument>("users").Find(new BsonDocument("_id", ObjectId.Parse(venue.OwnerId))).Project(new BsonDocument { { "displayName", 1 }, { "avatar", 1 }, { "phone", 1 } }).FirstOrDefaultAsync(ct);
            result["ownerId"] = user is null ? null : BookingService.UserView(user);
        }

        return result;
    }

    public async Task<object> GetAsync(string id, CancellationToken ct = default)
    {
        Guard.Id(id);
        var venue = await db.Venues.AsQueryable().FirstOrDefaultAsync(v => v.Id == id && v.IsActive, ct) ?? throw ApiException.NotFound("Không tìm thấy cơ sở sân này");
        var courts = await db.Courts.AsQueryable().Where(c => c.VenueId == id && c.Status == "AVAILABLE").ToListAsync(ct);
        return await FormatAsync(venue, courts, ct);
    }

    public async Task<(object Data, object Pagination)> SearchAsync(CourtSearchRequest input, bool activeOnly = false, CancellationToken ct = default)
    {
        var(page, limit) = Guard.Page(input.Page, input.Limit);
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
        var filter = Builders<Venue>.Filter.Eq(v => v.IsActive, true);
        if (!string.IsNullOrWhiteSpace(input.Q))
            filter &= Builders<Venue>.Filter.Regex(v => v.Name, new BsonRegularExpression(Regex.Escape(Guard.Text(input.Q, "Từ khóa", 200)), "i"));
        if (!string.IsNullOrWhiteSpace(input.SportType))
            filter &= Builders<Venue>.Filter.AnyEq(v => v.Sports, BookingRules.Sport(input.SportType));
        if (!string.IsNullOrWhiteSpace(input.District) && input.District != "Tất cả")
            filter &= Builders<Venue>.Filter.Regex(v => v.Address.City, new BsonRegularExpression(Regex.Escape(Guard.Text(input.District, "Quận", 200)), "i"));
        if (input.MinPrice.HasValue || input.MaxPrice.HasValue)
        {
            var min = input.MinPrice ?? 0;
            var max = input.MaxPrice ?? double.MaxValue;
            var venues = await db.Courts.AsQueryable().Where(c => c.Status == "AVAILABLE" && c.PricePerHour >= min && c.PricePerHour <= max).Select(c => c.VenueId).Distinct().ToListAsync(ct);
            filter &= Builders<Venue>.Filter.In(v => v.Id, venues);
        }

        if (input.Lat.HasValue)
            filter &= Builders<Venue>.Filter.GeoWithinCenterSphere(v => v.Location, input.Lng!.Value, input.Lat.Value, (input.Radius ?? 10) / 6378.1);
        var total = await db.Venues.CountDocumentsAsync(filter, cancellationToken: ct);
        var sort = input.SortBy == "rating" ? Builders<Venue>.Sort.Descending(v => v.Rating.TotalScore) : Builders<Venue>.Sort.Descending(v => v.CreatedAt);
        List<Venue> rows;
        if (input.Lat.HasValue && (input.SortBy is null or "distance"))
        {
            var near = Builders<Venue>.Filter.Near(v => v.Location, input.Lng!.Value, input.Lat.Value, (input.Radius ?? 10) * 1000);
            rows = await db.Venues.Find(filter & near).Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        }
        else
            rows = await db.Venues.Find(filter).Sort(sort).Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        var venueIds = rows.Select(v => v.Id).ToArray();
        var children = await db.Courts.AsQueryable().Where(c => venueIds.Contains(c.VenueId) && c.Status == "AVAILABLE").ToListAsync(ct);
        var result = new List<JsonObject>();
        foreach (var row in rows)
        {
            var view = await FormatAsync(row, children.Where(c => c.VenueId == row.Id).ToList(), ct);
            if (input.Lat.HasValue)
                view["distance"] = Distance(input.Lat.Value, input.Lng!.Value, row.Location.Coordinates[1], row.Location.Coordinates[0]);
            result.Add(view);
        }

        return (result, Guard.Pagination(page, limit, total));
    }

    private static double Distance(double lat, double lng, double otherLat, double otherLng)
    {
        var dLat = (otherLat - lat) * Math.PI / 180;
        var dLng = (otherLng - lng) * Math.PI / 180;
        var a = Math.Pow(Math.Sin(dLat / 2), 2) + Math.Cos(lat * Math.PI / 180) * Math.Cos(otherLat * Math.PI / 180) * Math.Pow(Math.Sin(dLng / 2), 2);
        return 6371 * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(Math.Max(0, 1 - a)));
    }

    public async Task<List<string>> DistrictsAsync(CancellationToken ct = default) => await db.Venues.AsQueryable().Where(v => v.IsActive).Select(v => v.Address.City).Distinct().OrderBy(s => s).ToListAsync(ct);
    public Task<List<Court>> MineAsync(string ownerId, CancellationToken ct = default) => owners.CourtsAsync(ownerId, ct);
    public async Task<Court> UpdateAsync(string ownerId, string courtId, CourtRequest input, bool admin = false, CancellationToken ct = default)
    {
        if (!admin)
            return await owners.UpdateCourtAsync(ownerId, courtId, input, ct);
        Guard.Id(courtId);
        return await bookings.WithCourtsAsync([courtId], async (session, token) =>
        {
            var court = await db.Courts.Find(session, c => c.Id == courtId).FirstOrDefaultAsync(token) ?? throw ApiException.NotFound();
            OwnerService.ApplyCourt(court, input, false);
            court.UpdatedAt = DateTime.UtcNow;
            await db.Courts.ReplaceOneAsync(session, c => c.Id == courtId, court, cancellationToken: token);
            return court;
        }, ct);
    }

    public async Task<object> CreateAsync(string ownerId, CreateCourtRequest input, CancellationToken ct = default)
    {
        if (input.Courts.Count is < 1 or > 100)
            throw ApiException.BadRequest("Cần ít nhất một sân con");
        foreach (var child in input.Courts)
        {
            child.PricingConfigs ??= input.PricePerHour.FirstOrDefault(p => p.SportType.Equals(child.SportType, StringComparison.OrdinalIgnoreCase))?.TimeSlots ?? [];
            child.PricePerHour ??= child.PricingConfigs.FirstOrDefault()?.PricePerHour ?? (child.SportType?.Equals("pickleball", StringComparison.OrdinalIgnoreCase) == true ? 120000 : 80000);
        }

        var venue = await owners.CreateVenueWithCourtsAsync(ownerId, new() { Name = input.Name, Location = new() { Coordinates = [input.Location.Lng, input.Location.Lat] }, Address = new() { Street = input.Address.Street, State = input.Address.Ward, City = input.Address.District }, Contact = input.Contact, Sports = input.SportTypes.Count > 0 ? input.SportTypes : input.Courts.Select(c => c.SportType ?? "BADMINTON").ToList(), Images = input.Images }, input.Courts, ct);
        return await GetAsync(venue.Id, ct);
    }

    public async Task<object> SlotsAsync(string venueId, string courtId, string date, CancellationToken ct = default)
    {
        Guard.Id(venueId);
        Guard.Id(courtId);
        var day = BookingRules.Date(date);
        var court = await db.Courts.AsQueryable().FirstOrDefaultAsync(c => c.Id == courtId && c.VenueId == venueId && c.Status == "AVAILABLE", ct) ?? throw ApiException.NotFound("Không tìm thấy sân");
        return await bookings.WithCourtsAsync([courtId], async (session, token) =>
        {
            var existing = await db.TimeSlots.Find(session, s => s.CourtId == venueId && s.SubCourtId == courtId && s.Date >= day && s.Date < day.AddDays(1)).ToListAsync(token);
            var rows = new List<TimeSlot>();
            for (var minute = 6 * 60; minute < 22 * 60; minute += 30)
            {
                var start = $"{minute / 60:00}:{minute % 60:00}";
                var endMinute = minute + 30;
                var end = $"{endMinute / 60:00}:{endMinute % 60:00}";
                var slot = existing.FirstOrDefault(s => s.StartTime == start) ?? new TimeSlot
                {
                    CourtId = venueId,
                    SubCourtId = courtId,
                    Date = day,
                    StartTime = start,
                    EndTime = end,
                    Price = BookingRules.Price(court, day, start, end)
                };
                if (!existing.Any(s => s.Id == slot.Id))
                    await db.TimeSlots.InsertOneAsync(session, slot, cancellationToken: token);
                var conflict = await db.Bookings.Find(session, Builders<Repository.Entities.Booking>.Filter.Where(b => b.CourtId == venueId && b.SubCourtId == courtId && b.Date >= day && b.Date < day.AddDays(1)) & BookingService.ActiveFilter(DateTime.UtcNow) & Builders<Repository.Entities.Booking>.Filter.Lt(b => b.StartTime, slot.EndTime) & Builders<Repository.Entities.Booking>.Filter.Gt(b => b.EndTime, slot.StartTime)).AnyAsync(token);
                slot.Status = conflict ? "booked" : "available";
                rows.Add(slot);
            }

            return rows;
        }, ct);
    }
}
