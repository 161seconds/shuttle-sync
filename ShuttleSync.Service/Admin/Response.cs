using MongoDB.Bson;

namespace ShuttleSync.Service.Admin;
public static class AdminResponse
{
    public static object? Json(BsonValue value) => value.BsonType switch
    {
        BsonType.Document => value.AsBsonDocument.Elements.Where(x => !new[] { "password", "refreshTokens", "otpCode", "otpExpires", "otpAttempts", "tokenVersion" }.Contains(x.Name)).ToDictionary(x => x.Name, x => Json(x.Value)),
        BsonType.Array => value.AsBsonArray.Select(Json).ToArray(),
        BsonType.ObjectId => value.AsObjectId.ToString(),
        BsonType.DateTime => value.ToUniversalTime(),
        BsonType.Null => null,
        BsonType.Boolean => value.AsBoolean,
        BsonType.Int32 => value.AsInt32,
        BsonType.Int64 => value.AsInt64,
        BsonType.Double => value.AsDouble,
        BsonType.Decimal128 => value.AsDecimal128.ToString(),
        _ => value.ToString()};
}
