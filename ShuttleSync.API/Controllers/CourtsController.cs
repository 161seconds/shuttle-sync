using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/courts")]
public sealed class CourtsController(CourtService courts) : ApiControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] CourtSearchRequest input, CancellationToken ct)
    {
        var result = await courts.SearchAsync(input, ct: ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [HttpGet("districts")]
    public async Task<IActionResult> Districts(CancellationToken ct) => Success(await courts.DistrictsAsync(ct));
    [HttpGet("active")]
    public async Task<IActionResult> Active([FromQuery] CourtSearchRequest input, CancellationToken ct)
    {
        var result = await courts.SearchAsync(input, true, ct);
        return Success(result.Data, pagination: result.Pagination);
    }

    [HttpGet("{idOrSlug}")]
    public async Task<IActionResult> Get(string idOrSlug, CancellationToken ct) => Success(await courts.GetAsync(idOrSlug, ct));
    [HttpGet("{courtId}/slots/{subCourtId}")]
    public async Task<IActionResult> Slots(string courtId, string subCourtId, [FromQuery] string date, CancellationToken ct) => Success(await courts.SlotsAsync(courtId, subCourtId, date, ct));
    [Authorize(Roles = "court_owner,admin"), HttpPost]
    public async Task<IActionResult> Create(CreateCourtRequest input, CancellationToken ct) => SuccessCreated(await courts.CreateAsync(UserId, input, ct));
    [Authorize(Roles = "court_owner,admin"), HttpGet("owner/my-courts")]
    public async Task<IActionResult> Mine(CancellationToken ct) => Success(await courts.MineAsync(UserId, ct));
    [Authorize(Roles = "court_owner,admin"), HttpPut("{courtId}")]
    public async Task<IActionResult> Update(string courtId, CourtRequest input, CancellationToken ct) => Success(await courts.UpdateAsync(UserId, courtId, input, Role == "admin", ct));
}
