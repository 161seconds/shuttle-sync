using MongoDB.Driver;
using ShuttleSync.Repository;
using ShuttleSync.Repository.Entities;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;
using ShuttleSync.Service.NotificationService;

namespace ShuttleSync.Service.Social;
public sealed class GroupPlayService(MongoContext db, IRealtime realtime, INotificationService notifications)
{
    public async Task<GroupPlay> GetAsync(string id, CancellationToken ct = default)
    {
        Guard.Id(id);
        return await db.GroupPlays.Find(g => g.Id == id).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
    }

    public async Task<object> PopulateAsync(GroupPlay group, CancellationToken ct = default, bool detail = false)
    {
        var result = ChatService.Document(group);
        var user = await db.Users.Find(u => u.Id == group.OrganizerId).FirstOrDefaultAsync(ct);
        result["organizerId"] = user == null ? null : detail ? new
        {
            _id = user.Id,
            user.DisplayName,
            user.Avatar,
            user.Phone,
            user.Stats
        }

        : ChatService.PublicUser(user);
        result["courtId"] = await db.Venues.Find(v => v.Id == group.CourtId).FirstOrDefaultAsync(ct);
        return result;
    }

    public async Task<(List<object> Data, object Pagination)> SearchAsync(string? userId, GroupSearch query, CancellationToken ct = default)
    {
        if (query.SportType != null && query.SportType is not ("badminton" or "pickleball"))
            throw ApiException.BadRequest("Invalid sport");
        if (query.Status != null && query.Status is not ("open" or "full" or "in_progress" or "completed" or "cancelled"))
            throw ApiException.BadRequest("Invalid status");
        if (query.SkillLevel != null)
            ValidateSkill(query.SkillLevel);
        if (userId != null)
            await db.GroupPlays.UpdateManyAsync(g => g.Status == "cancelled" || g.Date < DateTime.UtcNow.Date, Builders<GroupPlay>.Update.PullFilter(g => g.JoinRequests, r => r.Status == "pending"), cancellationToken: ct);
        var f = Builders<GroupPlay>.Filter;
        var filter = userId == null ? f.Eq(g => g.IsPublic, true) & f.Eq(g => g.Status, query.Status ?? "open") : f.Or(f.ElemMatch(g => g.Participants, p => p.UserId == userId), f.ElemMatch(g => g.JoinRequests, r => r.UserId == userId && r.Status == "pending"));
        if (userId == null)
        {
            if (query.SportType != null)
                filter &= f.Eq(g => g.SportType, query.SportType);
            if (query.SkillLevel != null)
                filter &= f.Eq(g => g.SkillLevel, query.SkillLevel);
            var date = query.Date?.Date ?? DateTime.UtcNow.Date;
            filter &= f.Gte(g => g.Date, date);
            if (query.Date != null)
                filter &= f.Lt(g => g.Date, date.AddDays(1));
            if (query.District != null)
            {
                var venues = await db.Venues.Find(v => v.Address.City == query.District).Project(v => v.Id).ToListAsync(ct);
                filter &= f.In(g => g.CourtId, venues);
            }
        }

        var(page, limit) = Guard.Page(query.Page, query.Limit);
        var total = await db.GroupPlays.CountDocumentsAsync(filter, cancellationToken: ct);
        var found = db.GroupPlays.Find(filter);
        found = userId == null ? found.SortBy(g => g.Date).ThenBy(g => g.StartTime) : found.SortByDescending(g => g.Date);
        var groups = await found.Skip((page - 1) * limit).Limit(limit).ToListAsync(ct);
        var result = new List<object>();
        foreach (var group in groups)
            result.Add(await PopulateAsync(group, ct));
        return (result, Guard.Pagination(page, limit, total));
    }

    public async Task<GroupPlay> CreateAsync(string userId, CreateGroup request, CancellationToken ct = default)
    {
        Guard.Id(request.CourtId);
        Guard.Id(request.SubCourtId);
        Guard.Id(request.BookingId);
        var title = Guard.Text(request.Title, "Title", 100, 2);
        ValidateSkill(request.SkillLevel);
        if (request.Date == default)
            throw ApiException.BadRequest("Invalid date");
        if (request.MaxPlayers is < 2 or > 30 || !double.IsFinite(request.PricePerPlayer) || request.PricePerPlayer < 0 || request.Description?.Length > 500 || request.Requirements?.Length > 300 || request.SportType is not ("badminton" or "pickleball"))
            throw ApiException.BadRequest("Invalid group details");
        if (!TimeOnly.TryParseExact(request.StartTime, "HH:mm", out var start) || !TimeOnly.TryParseExact(request.EndTime, "HH:mm", out var end) || end <= start)
            throw ApiException.BadRequest("Invalid time range");
        var user = await db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync(ct) ?? throw ApiException.Unauthorized();
        var booking = await db.Bookings.Find(b => b.Id == request.BookingId && b.UserId == userId).FirstOrDefaultAsync(ct) ?? throw ApiException.BadRequest("Booking does not belong to you");
        if (booking.CourtId != request.CourtId || booking.SubCourtId != request.SubCourtId || booking.Status is not ("confirmed" or "completed"))
            throw ApiException.BadRequest("Booking is not available for group play");
        if (booking.Date.Date != request.Date.Date || booking.StartTime != request.StartTime || booking.EndTime != request.EndTime)
            throw ApiException.BadRequest("Group must match the booked time");
        var group = new GroupPlay
        {
            Title = title,
            Description = request.Description,
            OrganizerId = userId,
            CourtId = request.CourtId,
            SubCourtId = request.SubCourtId,
            BookingId = request.BookingId,
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SportType = request.SportType,
            SkillLevel = request.SkillLevel,
            MaxPlayers = request.MaxPlayers,
            PricePerPlayer = request.PricePerPlayer,
            IsPublic = request.IsPublic,
            Requirements = request.Requirements,
            ContactInfo = request.ContactInfo,
            PriceConfig = new(),
            Participants = [new()
            {
                UserId = userId,
                DisplayName = user.DisplayName,
                Avatar = user.Avatar,
                Role = "organizer",
                HasPaid = true
            }

            ]
        };
        await db.GroupPlays.InsertOneAsync(group, cancellationToken: ct);
        await db.Users.UpdateOneAsync(u => u.Id == userId, Builders<User>.Update.Inc(u => u.Stats.TotalGroupsCreated, 1), cancellationToken: ct);
        await notifications.CreateAsync(userId, "Tạo nhóm thành công", $"Bạn đã tạo nhóm {title}", "group_play", ct: ct);
        return group;
    }

    async Task SaveAsync(GroupPlay group, CancellationToken ct)
    {
        var version = group.Version;
        group.Version++;
        group.UpdatedAt = DateTime.UtcNow;
        var f = Builders<GroupPlay>.Filter;
        var concurrency = f.Eq(g => g.Version, version);
        if (version == 0)
            concurrency |= f.Exists("__v", false);
        var result = await db.GroupPlays.ReplaceOneAsync(f.Eq(g => g.Id, group.Id) & concurrency, group, cancellationToken: ct);
        if (result.MatchedCount == 0)
            throw ApiException.Conflict("Group changed, please retry");
    }

    public async Task<GroupPlay> JoinAsync(string id, string userId, CancellationToken ct = default)
    {
        var group = await GetAsync(id, ct);
        if (group.Status != "open" || group.CurrentPlayers >= group.MaxPlayers)
            throw ApiException.BadRequest("Group is full or closed");
        if (group.Participants.Any(p => p.UserId == userId) || group.JoinRequests.Any(r => r.UserId == userId))
            throw ApiException.Conflict("Already joined or requested");
        var user = await db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync(ct) ?? throw ApiException.Unauthorized();
        group.JoinRequests.Add(new() { UserId = userId, DisplayName = user.DisplayName, Avatar = user.Avatar });
        await SaveAsync(group, ct);
        await notifications.CreateAsync(group.OrganizerId, "Yêu cầu tham gia mới", $"{user.DisplayName} muốn tham gia {group.Title}", "group_play", ct: ct);
        await realtime.UserAsync(group.OrganizerId, "join_request_received", new { groupPlayId = id, userId }, ct);
        return group;
    }

    public async Task<GroupPlay> RequestAsync(string id, string requesterId, string userId, bool accept, string? reason, CancellationToken ct = default)
    {
        Guard.Id(requesterId);
        var group = await GetAsync(id, ct);
        if (group.OrganizerId != userId)
            throw ApiException.Forbidden();
        var request = group.JoinRequests.FirstOrDefault(r => r.UserId == requesterId && r.Status == "pending") ?? throw ApiException.NotFound("Pending request not found");
        if (accept)
        {
            if (group.Status != "open" || group.CurrentPlayers >= group.MaxPlayers)
                throw ApiException.Conflict("Group is full or closed");
            var user = await db.Users.Find(u => u.Id == requesterId).FirstOrDefaultAsync(ct) ?? throw ApiException.NotFound();
            group.JoinRequests.Remove(request);
            group.Participants.Add(new() { UserId = requesterId, DisplayName = user.DisplayName, Avatar = user.Avatar, IsGuest = false });
            group.CurrentPlayers = group.Participants.Count;
            if (group.CurrentPlayers >= group.MaxPlayers)
                group.Status = "full";
        }
        else
        {
            request.Status = "rejected";
            request.RejectReason = reason is null ? "Từ chối bởi chủ nhóm" : Guard.Text(reason, "Reason", 200);
        }

        await SaveAsync(group, ct);
        if (accept)
            await db.Users.UpdateOneAsync(u => u.Id == requesterId, Builders<User>.Update.Inc(u => u.Stats.TotalGroupsJoined, 1), cancellationToken: ct);
        await notifications.CreateAsync(requesterId, accept ? "Đã được duyệt" : "Yêu cầu bị từ chối", group.Title, "group_play", ct: ct);
        await realtime.UserAsync(requesterId, accept ? "join_request_accepted" : "join_request_rejected", new { groupPlayId = id }, ct);
        if (accept)
            await realtime.RoomAsync($"group_play:{id}", "user_joined", new { userId = requesterId }, ct);
        return group;
    }

    public async Task<GroupPlay> ActionAsync(string id, string userId, string action, CancellationToken ct = default)
    {
        var group = await GetAsync(id, ct);
        if (action == "cancel")
        {
            if (group.OrganizerId != userId)
                throw ApiException.Forbidden();
            group.Status = "cancelled";
            group.JoinRequests.RemoveAll(r => r.Status == "pending");
        }
        else if (action == "leave")
        {
            if (group.OrganizerId == userId)
                throw ApiException.BadRequest("Organizer must cancel instead");
            if (group.Participants.RemoveAll(p => p.UserId == userId) == 0)
                throw ApiException.BadRequest("Not a participant");
            group.CurrentPlayers = group.Participants.Count;
            if (group.Status == "full")
                group.Status = "open";
        }
        else if (group.JoinRequests.RemoveAll(r => r.UserId == userId && r.Status == "pending") == 0)
            throw ApiException.BadRequest("Pending request not found");
        await SaveAsync(group, ct);
        return group;
    }

    static void ValidateSkill(string value)
    {
        if (value is not ("y" or "y_minus" or "y_plus" or "tby_minus" or "tby" or "tby_plus" or "tb_minus" or "tb" or "tb_plus" or "tb_plus_2" or "tb_plus_3" or "tbk" or "bc" or "cn"))
            throw ApiException.BadRequest("Invalid skill level");
    }
}

public sealed record CreateGroup(string Title, string? Description, string CourtId, string SubCourtId, string BookingId, DateTime Date, string StartTime, string EndTime, string SportType, string SkillLevel, int MaxPlayers, double PricePerPlayer, bool IsPublic = true, string? Requirements = null, string? ContactInfo = null);
public sealed record GroupSearch(string? SportType = null, string? SkillLevel = null, DateTime? Date = null, string? District = null, string? Status = null, int Page = 1, int Limit = 20);
