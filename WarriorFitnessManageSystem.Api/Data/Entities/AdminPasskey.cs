namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class AdminPasskey
{
    public Guid AdminPasskeyID { get; set; }
    public Guid AdminID { get; set; }
    // byte[] 對應 PostgreSQL 的 bytea（二進位資料）
    public byte[] AdminPasskeyCredentialId { get; set; } = [];
    public byte[] AdminPasskeyPublicKey { get; set; } = [];
    public long AdminPasskeySignCount { get; set; }
    public string AdminPasskeyDeviceName { get; set; } = string.Empty;
    public DateTimeOffset AdminPasskeyCreatedTime { get; set; }
    public DateTimeOffset? AdminPasskeyLastUsedTime { get; set; }

    public Admin Admin { get; set; } = null!;
}
