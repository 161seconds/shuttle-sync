using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using ShuttleSync.Service.Exceptions;

namespace ShuttleSync.Service.Common;
public static class Guard
{
    public static string Id(string? id)
    {
        if (!ObjectId.TryParse(id, out _))
            throw ApiException.BadRequest("ID không hợp lệ");
        return id!;
    }

    public static string Text(string? value, string name, int max = 2000, int min = 1)
    {
        value = value?.Trim();
        if (value is null || value.Length < min || value.Length > max)
            throw ApiException.BadRequest($"{name} không hợp lệ");
        return value;
    }

    public static string Email(string? value)
    {
        value = Text(value, "Email", 254).ToLowerInvariant();
        if (!new EmailAddressAttribute().IsValid(value))
            throw ApiException.BadRequest("Email không hợp lệ");
        return value;
    }

    public static (int Page, int Limit) Page(int page = 1, int limit = 20) => (Math.Clamp(page, 1, int.MaxValue / 100), Math.Clamp(limit, 1, 100));
    public static object Pagination(int page, int limit, long total) => new
    {
        page,
        limit,
        total,
        totalPages = (int)Math.Ceiling((double)total / limit)
    };
}
