namespace WarriorFitnessManageSystem.Api.Data.Dtos;

// 後台新增：只收 Storage 路徑，網址由後端自己組，不接受前端傳來的任意網址
public record CreateSiteImageRequest(string Category, string StoragePath, string? AltText, string? LinkUrl);

public record UpdateSiteImageRequest(string? AltText, string? LinkUrl, bool IsVisible);

// 後台用：包含所有欄位
public record SiteImageItem(
    Guid Id,
    string Category,
    string StoragePath,
    string Url,
    string AltText,
    string? LinkUrl,
    int SortOrder,
    bool IsVisible);

// 前台用：只給畫面需要的欄位，Storage 路徑、排序、顯示狀態這些內部資訊不外露
public record PublicSiteImage(Guid Id, string Url, string AltText, string? LinkUrl);