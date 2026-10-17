using ShuttleSync.Service.Chat;
using ShuttleSync.Service.Friends;
using ShuttleSync.Service.GroupPlays;
using ShuttleSync.Service.Tournaments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/chat"), Authorize]
public sealed class ChatController(IChatService service) : ApiControllerBase
{
    [HttpGet("group/{id}")]
    public async Task<IActionResult> History(string id, int page = 1, int limit = 50, CancellationToken ct = default) => Success(await service.HistoryAsync(id, UserId, page, limit, ct));
    [HttpDelete("group/{id}")]
    public async Task<IActionResult> DeleteGroup(string id, CancellationToken ct)
    {
        await service.DeleteGroupAsync(id, UserId, ct);
        return Success();
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> Conversations(CancellationToken ct) => Success(await service.ConversationsAsync(UserId, ct));
    [HttpPost("conversations")]
    public async Task<IActionResult> Conversation(RecipientRequest request, CancellationToken ct) => Success(await service.PopulateAsync(await service.GetOrCreateAsync(UserId, request.RecipientId, ct), ct));
    [HttpGet("conversations/{id}/messages")]
    public async Task<IActionResult> Messages(string id, CancellationToken ct) => Success(await service.MessagesAsync(id, UserId, ct));
    [HttpPut("conversations/{id}/archive")]
    public async Task<IActionResult> Archive(string id, ArchiveRequest request, CancellationToken ct)
    {
        await service.ArchiveAsync(id, UserId, request.IsArchived, ct);
        return Success();
    }

    [HttpDelete("conversations/{id}")]
    public async Task<IActionResult> DeleteConversation(string id, CancellationToken ct)
    {
        await service.DeleteConversationAsync(id, UserId, ct);
        return Success();
    }

    [HttpDelete("messages/{id}")]
    public async Task<IActionResult> DeleteMessage(string id, [FromBody] DeleteMessageRequest request, CancellationToken ct)
    {
        await service.DeleteMessageAsync(id, UserId, request.Type, ct);
        return Success();
    }
}

[Route("api/v1/friends"), Authorize]
public sealed class FriendsController(IFriendService service) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Friends(CancellationToken ct) => Success(await service.ListAsync(UserId, false, ct));
    [HttpGet("pending")]
    public async Task<IActionResult> Pending(CancellationToken ct) => Success(await service.ListAsync(UserId, true, ct));
    [HttpGet("search")]
    public async Task<IActionResult> Search(string query, CancellationToken ct) => Success(await service.SearchAsync(UserId, query, ct));
    [HttpPost("request")]
    public async Task<IActionResult> SendRequest(FriendRequest request, CancellationToken ct) => SuccessCreated(await service.RequestAsync(UserId, request.RecipientId, ct));
    [HttpPost("accept/{id}")]
    public async Task<IActionResult> Accept(string id, CancellationToken ct) => Success(await service.RespondAsync(UserId, id, true, ct));
    [HttpDelete("request/{id}/decline")]
    public async Task<IActionResult> Decline(string id, CancellationToken ct)
    {
        await service.RespondAsync(UserId, id, false, ct);
        return Success();
    }
}

[Route("api/v1/group-plays")]
public sealed class GroupPlaysController(IGroupPlayService service) : ApiControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] GroupSearch query, CancellationToken ct)
    {
        var result = await service.SearchAsync(null, query, ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct) => Success(await service.PopulateAsync(await service.GetAsync(id, ct), ct, true));
    [HttpGet("user/my"), Authorize]
    public async Task<IActionResult> My([FromQuery] GroupSearch query, CancellationToken ct)
    {
        var result = await service.SearchAsync(UserId, query, ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [HttpPost, Authorize]
    public async Task<IActionResult> Create(CreateGroup request, CancellationToken ct) => SuccessCreated(await service.CreateAsync(UserId, request, ct));
    [HttpPost("{id}/join"), Authorize]
    public async Task<IActionResult> Join(string id, CancellationToken ct) => Success(await service.JoinAsync(id, UserId, ct));
    [HttpPost("{id}/join/cancel"), Authorize]
    public async Task<IActionResult> CancelRequest(string id, CancellationToken ct) => Success(await service.ActionAsync(id, UserId, "request", ct));
    [HttpPost("{id}/leave"), Authorize]
    public async Task<IActionResult> Leave(string id, CancellationToken ct) => Success(await service.ActionAsync(id, UserId, "leave", ct));
    [HttpPost("{id}/cancel"), Authorize]
    public async Task<IActionResult> Cancel(string id, CancellationToken ct) => Success(await service.ActionAsync(id, UserId, "cancel", ct));
    [HttpPost("{id}/requests/{requesterId}/accept"), Authorize]
    public async Task<IActionResult> Accept(string id, string requesterId, CancellationToken ct) => Success(await service.RequestAsync(id, requesterId, UserId, true, null, ct));
    [HttpPost("{id}/requests/{requesterId}/reject"), Authorize]
    public async Task<IActionResult> Reject(string id, string requesterId, ReasonRequest request, CancellationToken ct) => Success(await service.RequestAsync(id, requesterId, UserId, false, request.Reason, ct));
}

[Route("api/v1/tournaments")]
public sealed class TournamentsController(ITournamentService service) : ApiControllerBase
{
    [HttpGet("my"), Authorize]
    public async Task<IActionResult> My(CancellationToken ct) => Success((await service.MyAsync(UserId, ct)).Select(TournamentResponse.From));
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct) => Success(TournamentResponse.From(await service.GetAsync(id, ct)));
    [HttpPost("quick"), Authorize]
    public async Task<IActionResult> Quick(TitleRequest request, CancellationToken ct) => SuccessCreated(TournamentResponse.From(await service.QuickAsync(UserId, request.Title, ct)));
    [HttpPost("{id}/start"), Authorize]
    public async Task<IActionResult> Start(string id, CancellationToken ct) => Success(TournamentResponse.From(await service.StartAsync(id, UserId, ct)));
    [HttpPut("{id}/matches/{matchId}"), Authorize]
    public async Task<IActionResult> Match(string id, string matchId, MatchRequest request, CancellationToken ct) => Success(TournamentResponse.From(await service.UpdateAsync(id, matchId, UserId, request, ct)));
}
