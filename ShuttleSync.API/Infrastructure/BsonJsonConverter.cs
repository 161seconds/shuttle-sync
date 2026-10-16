using System.Text.Json;
using System.Text.Json.Serialization;
using MongoDB.Bson;

namespace ShuttleSync.API.Infrastructure;
public sealed class BsonJsonConverter : JsonConverterFactory
{
    public override bool CanConvert(Type type) => typeof(BsonValue).IsAssignableFrom(type);
    public override JsonConverter CreateConverter(Type type, JsonSerializerOptions options) => (JsonConverter)Activator.CreateInstance(typeof(Converter<>).MakeGenericType(type))!;
    sealed class Converter<T> : JsonConverter<T> where T : BsonValue
    {
        public override T? Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options) => throw new JsonException("BSON response values cannot be supplied as request DTOs");
        public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options) => WriteValue(writer, value);
    }

    static void WriteValue(Utf8JsonWriter writer, BsonValue value)
    {
        switch (value.BsonType)
        {
            case BsonType.Document:
                writer.WriteStartObject();
                foreach (var item in value.AsBsonDocument)
                {
                    writer.WritePropertyName(item.Name);
                    WriteValue(writer, item.Value);
                }

                writer.WriteEndObject();
                break;
            case BsonType.Array:
                writer.WriteStartArray();
                foreach (var item in value.AsBsonArray)
                    WriteValue(writer, item);
                writer.WriteEndArray();
                break;
            case BsonType.ObjectId:
                writer.WriteStringValue(value.AsObjectId.ToString());
                break;
            case BsonType.DateTime:
                writer.WriteStringValue(value.ToUniversalTime());
                break;
            case BsonType.Boolean:
                writer.WriteBooleanValue(value.AsBoolean);
                break;
            case BsonType.Int32:
                writer.WriteNumberValue(value.AsInt32);
                break;
            case BsonType.Int64:
                writer.WriteNumberValue(value.AsInt64);
                break;
            case BsonType.Double:
                writer.WriteNumberValue(value.AsDouble);
                break;
            case BsonType.Decimal128:
                writer.WriteNumberValue(Decimal128.ToDecimal(value.AsDecimal128));
                break;
            case BsonType.Null:
            case BsonType.Undefined:
                writer.WriteNullValue();
                break;
            default:
                writer.WriteStringValue(value.ToString());
                break;
        }
    }
}
