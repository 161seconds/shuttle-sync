namespace ShuttleSync.Service.AiCoach;
public interface IAiCoachService
{
    Task<CoachResponse> AskAsync(AskRequest request, CancellationToken ct);
}
