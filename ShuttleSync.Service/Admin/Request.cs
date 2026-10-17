namespace ShuttleSync.Service.Admin;
public sealed record BanRequest(string? Reason, DateTime? ExpiresAt);
public sealed record StatusRequest(string? Status);
public sealed record ReviewRequest(string? Status, string? ReviewNotes);
public sealed record ResolveRequest(string? Resolution, string? Status);
