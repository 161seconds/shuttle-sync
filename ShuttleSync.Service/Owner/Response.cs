using ShuttleSync.Repository.Entities;
using System.Text.Json.Nodes;

namespace ShuttleSync.Service.Owner;
public sealed record OwnerScheduleResponse(List<Court> Courts, List<JsonObject> Bookings);
