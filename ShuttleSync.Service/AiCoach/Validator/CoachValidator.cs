using ShuttleSync.Service.Common;

namespace ShuttleSync.Service.AiCoach.Validator;
public static class CoachValidator
{
    public static string Message(AskRequest request) => Guard.Text(request.Message, "Message", 4000);
}
