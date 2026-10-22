using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Data.Options;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", async (
            LoginRequest request,
            AppDbContext db,
            AdminAuthService authService,
            AdminSessionService sessions,
            IOptions<AuthOptions> authOptions,
            IHostEnvironment env,
            HttpContext http) =>
        {
            var admin = await db.Admins
                .FirstOrDefaultAsync(a => a.AdminUsername == request.Username);

            if (admin is null || !authService.VerifyPassword(admin, request.Password))
            {
                return Results.Unauthorized();
            }

            var (token, session) = await sessions.CreateAsync(admin);
            http.Response.Cookies.Append(authOptions.Value.CookieName, token, CreateCookieOptions(env));

            return Results.Ok(ToSessionInfo(session, sessions));
        });

        // 不要求登入：Session 已經過期的人按登出也要能清掉 cookie
        group.MapPost("/logout", async (
            AdminSessionService sessions,
            IOptions<AuthOptions> authOptions,
            IHostEnvironment env,
            HttpContext http) =>
        {
            var cookieName = authOptions.Value.CookieName;
            if (http.Request.Cookies.TryGetValue(cookieName, out var token))
            {
                await sessions.RevokeAsync(token);
            }

            http.Response.Cookies.Delete(cookieName, CreateCookieOptions(env));
            return Results.NoContent();
        });

        // 查詢目前的登入狀態與剩餘時間，不會延長 Session
        group.MapGet("/session", (HttpContext http, AdminSessionService sessions) =>
                Results.Ok(ToSessionInfo(http.GetAdminSession(), sessions)))
            .RequireAuthorization()
            .WithMetadata(new SkipSessionRefreshAttribute());

        // 「延長登入」按鈕：經過驗證這一步本身就會延長，這裡只回傳新的剩餘時間
        group.MapPost("/refresh", (HttpContext http, AdminSessionService sessions) =>
                Results.Ok(ToSessionInfo(http.GetAdminSession(), sessions)))
            .RequireAuthorization();

        // 首次啟用用：只有在資料庫還沒有任何管理員時才能呼叫，之後這支自動失效
        group.MapPost("/bootstrap", async (
            LoginRequest request,
            AppDbContext db,
            AdminAuthService authService) =>
        {
            var hasAnyAdmin = await db.Admins.AnyAsync();
            if (hasAnyAdmin)
            {
                return Results.Forbid();
            }

            var admin = new Admin
            {
                AdminID = Guid.NewGuid(),
                AdminUsername = request.Username,
                AdminDisplayName = request.Username,
                AdminCreatedTime = DateTimeOffset.UtcNow,
                AdminModifiedTime = DateTimeOffset.UtcNow
            };
            admin.AdminPasswordHash = authService.HashPassword(admin, request.Password);

            db.Admins.Add(admin);
            await db.SaveChangesAsync();

            return Results.Created($"/api/admins/{admin.AdminID}", new { admin.AdminID, admin.AdminUsername });
        });
    }

    private static CookieOptions CreateCookieOptions(IHostEnvironment env) => new()
    {
        HttpOnly = true,                  // JavaScript 讀不到，XSS 偷不走
        Secure = !env.IsDevelopment(),    // 正式環境只走 HTTPS；本機是 http 所以關掉
        SameSite = SameSiteMode.Lax,      // 其他網站發出的 POST 不會帶上這個 cookie
        Path = "/",
        // 不設 Expires：關掉瀏覽器 cookie 就消失。逾時與否一律由伺服器判斷
    };

    private static SessionInfo ToSessionInfo(AdminSession session, AdminSessionService sessions) => new(
        session.Admin.AdminUsername,
        session.Admin.AdminDisplayName ?? session.Admin.AdminUsername,
        sessions.GetExpiresInSeconds(session));
}