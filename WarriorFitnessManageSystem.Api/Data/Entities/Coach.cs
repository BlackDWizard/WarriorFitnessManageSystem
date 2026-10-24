namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class Coach
{
    public Guid CoachID { get; set; }
    public string CoachName { get; set; } = string.Empty;
    public string CoachTitle { get; set; } = string.Empty;
    // Npgsql 會把 List<string> 直接對應到 PostgreSQL 的 text[] 陣列欄位
    public List<string> CoachSpecialties { get; set; } = [];
    public string CoachBio { get; set; } = string.Empty;
    public string? CoachPhotoStoragePath { get; set; }
    public int CoachSortOrder { get; set; }
    public bool CoachIsVisible { get; set; } = true;
    public DateTimeOffset CoachCreatedTime { get; set; }
    public DateTimeOffset CoachModifiedTime { get; set; }
}