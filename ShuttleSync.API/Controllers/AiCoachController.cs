using Microsoft.AspNetCore.Mvc;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/ask-coach")]
public sealed class AiCoachController(Service.AiCoach.Service service) : ApiControllerBase
{
    public sealed record AskRequest(string? Message);
    [HttpPost]
    public async Task<IActionResult> Ask(AskRequest request, CancellationToken ct) => Ok(await service.AskAsync(request.Message, ct));
}
