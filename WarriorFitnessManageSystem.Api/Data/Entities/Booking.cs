namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class Booking
{
    public Guid BookingID { get; set; }
    public string BookingSource { get; set; } = string.Empty;
    public string BookingCourse { get; set; } = string.Empty;
    public string BookingGoal { get; set; } = string.Empty;
    public string BookingGoalOther { get; set; } = string.Empty;
    public string BookingHealthNotes { get; set; } = string.Empty;
    public string BookingName { get; set; } = string.Empty;
    public string BookingGender { get; set; } = string.Empty;
    // DateOnly 對應 PostgreSQL 的 date：生日只有日期，沒有時間和時區的問題
    public DateOnly BookingBirthday { get; set; }
    public string BookingPhone { get; set; } = string.Empty;
    public string BookingEmail { get; set; } = string.Empty;
    public string BookingLineId { get; set; } = string.Empty;
    public string BookingContactMethod { get; set; } = string.Empty;
    public string BookingPreferredTime { get; set; } = string.Empty;
    public bool BookingHadCoachBefore { get; set; }
    public string BookingPreferredCoach { get; set; } = string.Empty;
    public string BookingHelpNotes { get; set; } = string.Empty;
    public DateTimeOffset BookingConsentTime { get; set; }
    public DateTimeOffset? BookingHandledTime { get; set; }
    public DateTimeOffset BookingCreatedTime { get; set; }
    public DateTimeOffset BookingModifiedTime { get; set; }
}
