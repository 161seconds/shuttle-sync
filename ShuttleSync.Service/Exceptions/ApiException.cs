namespace ShuttleSync.Service.Exceptions;
public sealed class ApiException(int statusCode, string message, object? errors = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public object? Errors { get; } = errors;

    public static ApiException BadRequest(string message) => new(400, message);
    public static ApiException Unauthorized(string message = "Vui lòng đăng nhập") => new(401, message);
    public static ApiException Forbidden(string message = "Bạn không có quyền truy cập") => new(403, message);
    public static ApiException NotFound(string message = "Không tìm thấy tài nguyên") => new(404, message);
    public static ApiException Conflict(string message) => new(409, message);
}
