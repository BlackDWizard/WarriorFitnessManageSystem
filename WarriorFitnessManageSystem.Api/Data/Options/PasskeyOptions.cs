namespace WarriorFitnessManageSystem.Api.Data.Options;

public class PasskeyOptions
{
    // Relying Party ID：Passkey 綁定的網域，必須是「後台網頁」的網域（不是 API 的網域）
    // 正式環境 admin.warrior-fitness.net；本機 admin.localhost
    public string RpId { get; set; } = string.Empty;

    // 允許的網頁來源（含 https:// 和連接埠），例如 https://admin.warrior-fitness.net
    public string[] Origins { get; set; } = [];

    public bool IsConfigured => !string.IsNullOrWhiteSpace(RpId) && Origins.Length > 0;
}
