using System.Text.RegularExpressions;
using WarriorFitnessManageSystem.Api.Data.Dtos;

namespace WarriorFitnessManageSystem.Api.Services;

// 預約表單的選項和驗證規則。選項要跟前台 bookingOptions.ts 的 value 一致
public static partial class BookingRules
{
    public static readonly string[] Sources = ["傳單", "親友介紹", "網路廣告", "招牌", "路過"];
    public static readonly string[] Courses = ["預售中健身體驗課588元（1人）", "一對一教練課程", "一對一肌肉筋膜放鬆課程", "一對二教練課程"];
    public static readonly string[] Goals = ["增肌減脂", "增強肌耐力", "準備比賽", "我只是想運動", OtherGoal];
    public static readonly string[] Genders = ["男", "女", "其他"];
    public static readonly string[] ContactMethods = ["LINE", "電話"];

    public const string OtherGoal = "其他";
    public const string NoPreferredCoach = "不指定";

    public const int MaxShortTextLength = 100;
    public const int MaxLongTextLength = 500;

    // 手機號碼去掉空白和 - 之後只留數字，例如「0912-345-678」→「0912345678」
    public static string NormalizePhone(string? phone)
        => new((phone ?? string.Empty).Where(char.IsDigit).ToArray());

    // 回傳錯誤訊息；沒有錯誤回傳 null。today 由呼叫端傳入（台灣的今天），方便寫測試
    // 偏好教練要查資料庫，不在這裡檢查
    public static string? Validate(CreateBookingRequest r, DateOnly today)
    {
        if (!Sources.Contains(r.Source)) return "請選擇您如何得知本店";
        if (!Courses.Contains(r.Course)) return "請選擇想報名的課程";
        if (!Goals.Contains(r.Goal)) return "請選擇訓練目標";
        if (r.Goal == OtherGoal && string.IsNullOrWhiteSpace(r.GoalOther)) return "訓練目標選「其他」時，請簡單說明";
        if ((r.GoalOther?.Trim().Length ?? 0) > MaxShortTextLength) return $"訓練目標的說明請在 {MaxShortTextLength} 字以內";

        var error = Required(r.HealthNotes, "請填寫是否曾經手術或受傷（沒有的話可以填「無」）", MaxLongTextLength)
            ?? Required(r.Name, "請填寫姓名", 50);
        if (error is not null) return error;

        if (!Genders.Contains(r.Gender)) return "請選擇性別";

        if (r.Birthday is null) return "請填寫出生年月日";
        if (r.Birthday < new DateOnly(1900, 1, 1) || r.Birthday > today) return "出生年月日不正確";

        if (!MobilePattern().IsMatch(NormalizePhone(r.Phone))) return "手機號碼格式不正確，請填寫 09 開頭的 10 碼號碼";

        var email = r.Email?.Trim() ?? string.Empty;
        if (email.Length > MaxShortTextLength || !EmailPattern().IsMatch(email)) return "Email 格式不正確";

        error = Required(r.LineId, "請填寫 LINE ID", MaxShortTextLength);
        if (error is not null) return error;

        if (!ContactMethods.Contains(r.ContactMethod)) return "請選擇希望的聯繫方式";

        error = Required(r.PreferredTime, "請填寫方便聯繫的時間", MaxShortTextLength);
        if (error is not null) return error;

        if (r.HadCoachBefore is null) return "請選擇是否上過教練課";
        if (string.IsNullOrWhiteSpace(r.PreferredCoach)) return "請選擇偏好的教練";
        if ((r.HelpNotes?.Trim().Length ?? 0) > MaxLongTextLength) return $"「希望我們如何幫助您」請在 {MaxLongTextLength} 字以內";

        if (!r.Consent) return "請勾選同意個人資料的蒐集與使用";

        return null;
    }

    // 必填文字欄位的共用檢查：不能空白、不能太長
    private static string? Required(string? value, string emptyMessage, int maxLength)
    {
        var text = value?.Trim() ?? string.Empty;
        if (text.Length == 0) return emptyMessage;
        if (text.Length > maxLength) return $"內容太長了，請在 {maxLength} 字以內";
        return null;
    }

    // 台灣手機：09 開頭、共 10 碼
    [GeneratedRegex(@"^09\d{8}$")]
    private static partial Regex MobilePattern();

    // Email 只做基本檢查：有 @、@ 後面有點、沒有空白。完全正確的 Email 規則非常複雜，基本檢查擋掉打錯字就夠了
    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex EmailPattern();
}
