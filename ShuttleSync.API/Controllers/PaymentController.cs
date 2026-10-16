using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Booking;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.API.Controllers;
[Route("api/v1/payment")]
public sealed partial class PaymentController(BookingService bookings, IConfiguration configuration) : ApiControllerBase
{
    [HttpPost("sepay-webhook")]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        var secret = configuration["SEPAY_WEBHOOK_SECRET"]?.Trim();
        var token = configuration["SEPAY_API_TOKEN"]?.Trim();
        var account = configuration["SEPAY_ACCOUNT_NUMBER"]?.Trim();
        if ((string.IsNullOrEmpty(secret) && string.IsNullOrEmpty(token)) || string.IsNullOrEmpty(account))
            return StatusCode(503, new { success = false, message = "Payment webhook not configured" });
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var raw = await reader.ReadToEndAsync(ct);
        if (!string.IsNullOrEmpty(secret))
        {
            var signature = Request.Headers["x-sepay-signature"].ToString();
            if (signature.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
                signature = signature[7..];
            signature = signature.Trim();
            var timestamp = Request.Headers["x-sepay-timestamp"].ToString();
            var signed = string.IsNullOrEmpty(timestamp) ? raw : timestamp + "." + raw;
            var expected = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(signed));
            var expectedWithoutTimestamp = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(raw));
            byte[] received;
            try
            {
                received = Convert.FromHexString(signature);
            }
            catch (FormatException)
            {
                throw ApiException.Unauthorized("Invalid signature");
            }

            if (!CryptographicOperations.FixedTimeEquals(expected, received) && !CryptographicOperations.FixedTimeEquals(expectedWithoutTimestamp, received))
                throw ApiException.Unauthorized("Invalid signature");
        }

        if (!string.IsNullOrEmpty(token))
        {
            var auth = Request.Headers.Authorization.ToString();
            var supplied = Regex.Replace(auth, @"^(Bearer|Apikey)\s+", "", RegexOptions.IgnoreCase).Trim();
            if (string.IsNullOrEmpty(auth) || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(token), Encoding.UTF8.GetBytes(supplied)))
                throw ApiException.Unauthorized("Unauthorized");
        }

        WebhookRequest input;
        try
        {
            input = JsonSerializer.Deserialize<WebhookRequest>(raw, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? throw new JsonException();
        }
        catch (JsonException)
        {
            throw ApiException.BadRequest("Invalid transaction");
        }

        var reference = TransactionReference(input.ReferenceCode) ?? TransactionReference(input.Id);
        if (string.IsNullOrEmpty(input.Content) || input.AccountNumber != account || !double.IsFinite(input.TransferAmount) || input.TransferAmount <= 0 || string.IsNullOrWhiteSpace(reference) || reference.Length > 200)
            throw ApiException.BadRequest("Invalid transaction or recipient account");
        if (input.TransferType != "in")
            return Success(message: "Bỏ qua giao dịch tiền ra");
        var match = BookingCodePattern().Match(input.Content);
        if (!match.Success)
            return Success(message: "Không phải giao dịch đặt sân");
        var code = match.Value.ToUpperInvariant();
        if (await bookings.PaymentStatusAsync(code, ct) == "PENDING")
            return Success(message: "Không tìm thấy đơn hàng");
        await bookings.ConfirmAsync(code, new(reference.Trim(), input.TransferAmount), ct);
        return Success(message: "Xác nhận thanh toán thành công");
    }

    [HttpGet("status/{bookingCode}")]
    public async Task<IActionResult> Status(string bookingCode, CancellationToken ct) => Success(new { status = await bookings.PaymentStatusAsync(bookingCode, ct) });
    [GeneratedRegex(@"(GRP|BK)\d+", RegexOptions.IgnoreCase)]
    private static partial Regex BookingCodePattern();
    private static string? TransactionReference(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.String => value.GetString(),
        JsonValueKind.Number => value.GetRawText(),
        _ => null
    };
}
