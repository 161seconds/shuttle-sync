using System.Text.RegularExpressions;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Auth.Validator;
public static class AuthValidator
{
    public static string Password(string? value)
    {
        if (value is null || value.Length < 6 || value.Length > 50)
            throw ApiException.BadRequest("Mật khẩu phải có từ 6 đến 50 ký tự");
        if (!Regex.IsMatch(value, @"[a-z]") || !Regex.IsMatch(value, @"[A-Z]") || !Regex.IsMatch(value, @"[0-9]"))
            throw ApiException.BadRequest("Mật khẩu phải có chữ hoa, chữ thường và chữ số");
        return value;
    }

    public static string? Phone(string? phone)
    {
        if (phone is not null && !Regex.IsMatch(phone, @"^(0|\+84)\d{9}$"))
            throw ApiException.BadRequest("Số điện thoại không hợp lệ");
        return phone;
    }

    public static void Otp(string? otp)
    {
        if (otp is null || !Regex.IsMatch(otp, @"^\d{6}$"))
            throw ApiException.BadRequest("Mã OTP không hợp lệ");
    }
}
