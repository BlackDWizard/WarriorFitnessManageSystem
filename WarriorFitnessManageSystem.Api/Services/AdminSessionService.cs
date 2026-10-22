using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Data.Options;

namespace WarriorFitnessManageSystem.Api.Services;

public class AdminSessionService
{
    private readonly AppDbContext _db;
    private readonly AuthOptions _options;
    private readonly TimeProvider _time;

    public AdminSessionService(AppDbContext db, IOptions<AuthOptions> options, TimeProvider time)
    {
        _db = db;
        _options = options.Value;
        _time = time;
    }

    // 登入成功時呼叫：產生 token、寫一筆 Session，回傳原始 token 給呼叫端放進 cookie
    public async Task<(string Token, AdminSession Session)> CreateAsync(Admin admin)
    {
        var now = _time.GetUtcNow();
        var token = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
        var absoluteExpires = now.AddHours(_options.AbsoluteTimeoutHours);

        var session = new AdminSession
        {
            AdminSessionID = Guid.NewGuid(),
            AdminID = admin.AdminID,
            AdminSessionTokenHash = HashToken(token),
            AdminSessionExpiresTime = NextIdleExpires(now, absoluteExpires),
            AdminSessionAbsoluteExpiresTime = absoluteExpires,
            AdminSessionLastActivityTime = now,
            AdminSessionCreatedTime = now,
            AdminSessionModifiedTime = now,
            Admin = admin,
        };
        _db.AdminSessions.Add(session);

        // 順便清掉 30 天前就過期的舊紀錄，資料表不會無限長大
        var cleanupBefore = now.AddDays(-30);
        await _db.AdminSessions
            .Where(s => s.AdminSessionExpiresTime < cleanupBefore)
            .ExecuteDeleteAsync();

        await _db.SaveChangesAsync();
        return (token, session);
    }

    // 每個帶著 cookie 的請求都會呼叫：找出 Session，確認還有效
    // slide = true 時把閒置逾時往後延（一般操作）；false 時只查不延（查詢剩餘時間用）
    public async Task<AdminSession?> ValidateAsync(string token, bool slide)
    {
        var now = _time.GetUtcNow();
        var hash = HashToken(token);

        var session = await _db.AdminSessions
            .Include(s => s.Admin)
            .FirstOrDefaultAsync(s => s.AdminSessionTokenHash == hash);

        if (session is null
            || session.AdminSessionRevokedTime is not null
            || session.AdminSessionExpiresTime <= now)
        {
            return null;
        }

        if (slide)
        {
            session.AdminSessionExpiresTime = NextIdleExpires(now, session.AdminSessionAbsoluteExpiresTime);
            session.AdminSessionLastActivityTime = now;
            session.AdminSessionModifiedTime = now;
            await _db.SaveChangesAsync();
        }

        return session;
    }

    // 登出：標記撤銷時間。用 ExecuteUpdate 直接下 UPDATE，不用先查出來
    public async Task RevokeAsync(string token)
    {
        var now = _time.GetUtcNow();
        var hash = HashToken(token);

        await _db.AdminSessions
            .Where(s => s.AdminSessionTokenHash == hash && s.AdminSessionRevokedTime == null)
            .ExecuteUpdateAsync(set => set
                .SetProperty(s => s.AdminSessionRevokedTime, now)
                .SetProperty(s => s.AdminSessionModifiedTime, now));
    }

    // 回傳「還剩幾秒」而不是「幾點到期」，前端不受電腦時鐘誤差影響
    public int GetExpiresInSeconds(AdminSession session)
    {
        var remaining = session.AdminSessionExpiresTime - _time.GetUtcNow();
        return (int)Math.Max(0, Math.Floor(remaining.TotalSeconds));
    }

    // 閒置逾時 = 現在 + N 分鐘，但不能超過絕對逾時
    private DateTimeOffset NextIdleExpires(DateTimeOffset now, DateTimeOffset absoluteExpires)
    {
        var idleExpires = now.AddMinutes(_options.IdleTimeoutMinutes);
        return idleExpires < absoluteExpires ? idleExpires : absoluteExpires;
    }

    // 資料庫只存雜湊：就算資料庫外洩，拿到的雜湊也不能拿來登入
    private static string HashToken(string token)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}