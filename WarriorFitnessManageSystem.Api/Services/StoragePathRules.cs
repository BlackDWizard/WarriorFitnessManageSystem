using System.Text.RegularExpressions;

namespace WarriorFitnessManageSystem.Api.Services;

// 上傳 API 產生的 Storage 路徑格式：年-月/32 個十六進位字元.副檔名
// 網站圖片、教練照片……所有引用上傳檔案的地方都用這個檢查
public static partial class StoragePathRules
{
    public static bool IsValid(string? path)
        => path is not null && Pattern().IsMatch(path);

    [GeneratedRegex(@"^\d{4}-\d{2}/[0-9a-f]{32}\.(webp|jpg|png)$")]
    private static partial Regex Pattern();
}