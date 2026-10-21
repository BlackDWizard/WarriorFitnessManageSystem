public class AuthOptions
{
    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "WarriorFitnessManageSystem";
    public int ExpiryMinutes { get; set; } = 480; // 8 小時
}