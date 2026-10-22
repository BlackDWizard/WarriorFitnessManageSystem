using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Data.Options;

namespace WarriorFitnessManageSystem.Api.Services;

// 標記在 endpoint 上：這支 API 只查詢 Session，不延長閒置時間
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class SkipSessionRefreshAttribute : Attribute
{
}

public class SessionAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "AdminSession";
    public const string ExpiresInHeader = "X-Session-Expires-In";

    private readonly AdminSessionService _sessions;
    private readonly AuthOptions _authOptions;

    public SessionAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        AdminSessionService sessions,
        IOptions<AuthOptions> authOptions)
        : base(options, logger, encoder)
    {
        _sessions = sessions;
        _authOptions = authOptions.Value;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var token = Request.Cookies[_authOptions.CookieName];
        if (string.IsNullOrEmpty(token))
        {
            // 沒有 cookie：不是失敗，只是「沒登入」。需要登入的 API 會回 401
            return AuthenticateResult.NoResult();
        }

        var slide = Context.GetEndpoint()?.Metadata.GetMetadata<SkipSessionRefreshAttribute>() is null;
        var session = await _sessions.ValidateAsync(token, slide);
        if (session is null)
        {
            return AuthenticateResult.Fail("登入已逾時或已登出");
        }

        // 每個回應都附上剩餘秒數，前端用它更新倒數
        Response.Headers[ExpiresInHeader] = _sessions.GetExpiresInSeconds(session).ToString();

        // 讓 endpoint 可以直接取用這次的 Session，不用再查一次資料庫
        Context.Items[typeof(AdminSession)] = session;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, session.AdminID.ToString()),
            new Claim(ClaimTypes.Name, session.Admin.AdminUsername),
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
    }
}

public static class AdminSessionHttpContextExtensions
{
    public static AdminSession GetAdminSession(this HttpContext context)
        => (AdminSession)context.Items[typeof(AdminSession)]!;
}