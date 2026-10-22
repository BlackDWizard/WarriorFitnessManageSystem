namespace WarriorFitnessManageSystem.Api.Data.Options;

public class SupabaseStorageOptions
{
    // Supabase 專案網址。雲端例如 https://xxxx.supabase.co；本機是 http://127.0.0.1:54321
    public string Url { get; set; } = string.Empty;

    // 後端專用金鑰：新版 sb_secret_... 或舊版 service_role（eyJ 開頭的 JWT）
    // 擁有整個專案的完整權限，只能放在後端，絕對不能出現在前端
    public string SecretKey { get; set; } = string.Empty;

    public string Bucket { get; set; } = "site-images";

    // 單一檔案上限（bytes）。前端會先壓縮，正常情況遠低於這個值
    public long MaxUploadBytes { get; set; } = 5 * 1024 * 1024;
}