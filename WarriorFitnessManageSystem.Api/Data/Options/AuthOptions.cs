namespace WarriorFitnessManageSystem.Api.Data.Options;

public class AuthOptions
{
    // 閒置多久自動登出（分鐘）。每次操作都會重新計算
    public int IdleTimeoutMinutes { get; set; } = 15;

    // 登入後最長可以維持多久（小時）。就算一直有操作，時間到也要重新登入
    public int AbsoluteTimeoutHours { get; set; } = 12;

    public string CookieName { get; set; } = "wf_admin_session";
}