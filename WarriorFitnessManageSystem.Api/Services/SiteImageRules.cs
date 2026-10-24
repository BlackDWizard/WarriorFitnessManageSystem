using System.Text.RegularExpressions;

namespace WarriorFitnessManageSystem.Api.Services;

// 網站圖片的驗證規則集中在這裡，endpoint 只負責流程
public static partial class SiteImageRules
{
    public static readonly string[] Categories = ["Banner", "Pricing", "Testimonial", "Gallery"];

    public const int MaxAltTextLength = 200;

    public static bool IsValidCategory(string? category)
        => category is not null && Categories.Contains(category);

    // 只接受上傳 API 產生的路徑格式，防止有人送來 ../ 或別的 bucket 的路徑
    // 規則本身搬到 StoragePathRules，教練照片也共用
    public static bool IsValidStoragePath(string? path)
        => StoragePathRules.IsValid(path);

    // 連結只接受 http(s) 網址，或 / 開頭的站內路徑（但不能是 // 開頭，那會被當成別的網站）
    // 擋掉 javascript: 這類網址：放進 <a href> 之後，訪客一點就會執行裡面的程式碼
    public static bool IsValidLinkUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;

        if (url.StartsWith('/') && !url.StartsWith("//")) return true;

        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp);
    }

    // 空白字串存成 null，前後空白去掉
    public static string? NormalizeLinkUrl(string? url)
        => string.IsNullOrWhiteSpace(url) ? null : url.Trim();

    [GeneratedRegex(@"^\d{4}-\d{2}/[0-9a-f]{32}\.(webp|jpg|png)$")]
    private static partial Regex StoragePathPattern();
}