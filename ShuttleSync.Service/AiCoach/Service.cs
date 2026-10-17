using ShuttleSync.Service.AiCoach.Validator;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using ShuttleSync.Service.Common;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.AiCoach;
public sealed class Service(HttpClient http, IConfiguration config) : IAiCoachService
{
    public async Task<CoachResponse> AskAsync(AskRequest request, CancellationToken ct)
    {
        var message = CoachValidator.Message(request);
        var key = config["GEMINI_API_KEY"];
        if (string.IsNullOrWhiteSpace(key))
            throw new ApiException(503, "AI Coach is not configured");
        var prompt = "You are ShuttleSync Coach, a badminton coach. Reply concisely in Vietnamese; politely redirect unrelated questions to badminton. Return JSON with reply string and suggestions string array. Question: " + message;
        for (var attempt = 0; attempt < 4; attempt++)
        {
            using var response = await http.PostAsJsonAsync("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + Uri.EscapeDataString(key), new { contents = new[] { new { parts = new[] { new { text = prompt } } } }, generationConfig = new { responseMimeType = "application/json", temperature = 0.7 } }, ct);
            if (response.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable or HttpStatusCode.InternalServerError)
            {
                if (attempt < 3)
                {
                    await Task.Delay(TimeSpan.FromSeconds(attempt + 1), ct);
                    continue;
                }
            }

            if (!response.IsSuccessStatusCode)
                throw new ApiException(502, "Coach is busy, please try again later.");
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            var text = json.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
            text = text.Replace("```json", "").Replace("```", "").Trim();
            try
            {
                using var answer = JsonDocument.Parse(text);
                return new CoachResponse(answer.RootElement.GetProperty("reply").GetString(),
                    answer.RootElement.TryGetProperty("suggestions", out var suggestions) ? suggestions.Clone() : JsonSerializer.SerializeToElement(Array.Empty<string>()));
            }
            catch (JsonException)
            {
                return new CoachResponse(text, JsonSerializer.SerializeToElement(Array.Empty<string>()));
            }
        }

        throw new ApiException(502, "Coach unavailable");
    }
}
