namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class AdminSession
{
    public Guid AdminSessionID { get; set; }
    public Guid AdminID { get; set; }
    public string AdminSessionTokenHash { get; set; } = string.Empty;
    public DateTimeOffset AdminSessionExpiresTime { get; set; }
    public DateTimeOffset AdminSessionAbsoluteExpiresTime { get; set; }
    public DateTimeOffset AdminSessionLastActivityTime { get; set; }
    public DateTimeOffset? AdminSessionRevokedTime { get; set; }
    public DateTimeOffset AdminSessionCreatedTime { get; set; }
    public DateTimeOffset AdminSessionModifiedTime { get; set; }

    public Admin Admin { get; set; } = null!;
}