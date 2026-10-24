namespace WarriorFitnessManageSystem.Api.Data.Dtos;

// 前台送出的表單。全部欄位都允許 null，缺了什麼由 BookingRules 回傳清楚的錯誤訊息
public record CreateBookingRequest(
    string? Source,
    string? Course,
    string? Goal,
    string? GoalOther,
    string? HealthNotes,
    string? Name,
    string? Gender,
    DateOnly? Birthday,
    string? Phone,
    string? Email,
    string? LineId,
    string? ContactMethod,
    string? PreferredTime,
    bool? HadCoachBefore,
    string? PreferredCoach,
    string? HelpNotes,
    bool Consent,
    // 防機器人的隱藏欄位：真人看不到也不會填，有值就是機器人
    string? Website);

public record UpdateBookingHandledRequest(bool Handled);

// 後台清單：只放列表需要的欄位，身體狀況這些細節點進去才看得到
public record BookingListItem(
    Guid Id,
    DateTimeOffset CreatedTime,
    string Name,
    string Course,
    string Phone,
    string ContactMethod,
    string PreferredTime,
    bool IsHandled);

public record BookingDetail(
    Guid Id,
    DateTimeOffset CreatedTime,
    string Source,
    string Course,
    string Goal,
    string GoalOther,
    string HealthNotes,
    string Name,
    string Gender,
    DateOnly Birthday,
    string Phone,
    string Email,
    string LineId,
    string ContactMethod,
    string PreferredTime,
    bool HadCoachBefore,
    string PreferredCoach,
    string HelpNotes,
    DateTimeOffset? HandledTime);
