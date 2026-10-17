using ShuttleSync.Service.AiCoach;
using Microsoft.AspNetCore.Mvc;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/ask-coach")]
public sealed class AiCoachController(Service.AiCoach.IAiCoachService service) : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Ask(AskRequest request, CancellationToken ct) => Ok(await service.AskAsync(request, ct));
}
