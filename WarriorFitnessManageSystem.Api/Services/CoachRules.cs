using WarriorFitnessManageSystem.Api.Data.Dtos;

namespace WarriorFitnessManageSystem.Api.Services;

public static class CoachRules
{
    public const int MaxNameLength = 50;
    public const int MaxTitleLength = 50;
    public const int MaxBioLength = 1000;
    public const int MaxSpecialties = 10;
    public const int MaxSpecialtyLength = 20;

    // 專長整理：去掉前後空白、移除空的、移除重複的
    public static List<string> NormalizeSpecialties(IEnumerable<string>? specialties)
        => (specialties ?? [])
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .Distinct()
            .ToList();

    // 回傳錯誤訊息；沒有錯誤回傳 null
    public static string? Validate(SaveCoachRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length == 0) return "請填寫教練姓名";
        if (name.Length > MaxNameLength) return $"姓名不能超過 {MaxNameLength} 個字";

        if ((request.Title?.Trim().Length ?? 0) > MaxTitleLength) return $"職稱不能超過 {MaxTitleLength} 個字";
        if ((request.Bio?.Trim().Length ?? 0) > MaxBioLength) return $"自我介紹不能超過 {MaxBioLength} 個字";

        var specialties = NormalizeSpecialties(request.Specialties);
        if (specialties.Count > MaxSpecialties) return $"專長最多 {MaxSpecialties} 項";
        if (specialties.Any(s => s.Length > MaxSpecialtyLength)) return $"每項專長不能超過 {MaxSpecialtyLength} 個字";

        if (request.PhotoPath is not null && !StoragePathRules.IsValid(request.PhotoPath)) return "照片路徑不正確";

        return null;
    }
}