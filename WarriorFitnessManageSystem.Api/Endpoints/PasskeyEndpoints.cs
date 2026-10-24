using System.Text.Json;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Data.Options;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

// 指紋／Face ID 登入（Passkey）
// 綁定和登入都是兩步驟：
//   1. 後端產生一次性的挑戰碼（challenge），連同選項交給瀏覽器
//   2. 瀏覽器請使用者驗證指紋，裝置用私鑰簽章後送回來，後端用公鑰驗證
public static class PasskeyEndpoints
{
    public const string LoginRateLimitPolicy = "login";

    // 挑戰碼的有效時間：使用者要在這段時間內完成指紋驗證
    private static readonly TimeSpan CeremonyTimeout = TimeSpan.FromMinutes(5);

    public static void MapPasskeyEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth/passkeys");

        //---------- 綁定（需要先用密碼登入） ----------

        group.MapPost("/register/options", async (HttpContext http, AppDbContext db, IFido2 fido2, IMemoryCache cache) =>
        {
            var admin = http.GetAdminSession().Admin;

            // 已經綁定過的裝置排除掉，同一台裝置不會重複綁定
            var existing = await db.AdminPasskeys
                .Where(p => p.AdminID == admin.AdminID)
                .Select(p => p.AdminPasskeyCredentialId)
                .ToListAsync();

            var options = fido2.RequestNewCredential(new RequestNewCredentialParams
            {
                // User.Id 用管理員的 ID：登入時裝置會把它送回來，用來確認是哪個人
                User = new Fido2User
                {
                    Id = admin.AdminID.ToByteArray(),
                    Name = admin.AdminUsername,
                    DisplayName = admin.AdminDisplayName ?? admin.AdminUsername,
                },
                ExcludeCredentials = existing.Select(id => new PublicKeyCredentialDescriptor(id)).ToList(),
                AuthenticatorSelection = new AuthenticatorSelection
                {
                    // ResidentKey = Required：憑證存在裝置裡，登入時不用先輸入帳號
                    ResidentKey = ResidentKeyRequirement.Required,
                    // UserVerification = Required：一定要驗證指紋、臉部或裝置密碼，不能只是「碰一下」
                    UserVerification = UserVerificationRequirement.Required,
                },
                // 不需要裝置廠商的證明（attestation），只要公鑰就好
                AttestationPreference = AttestationConveyancePreference.None,
            });

            return Results.Ok(StartCeremony(cache, "register", options.ToJson()));
        }).RequireAuthorization();

        group.MapPost("/register", async (
            PasskeyRegisterRequest request,
            HttpContext http,
            AppDbContext db,
            IFido2 fido2,
            IMemoryCache cache,
            CancellationToken ct) =>
        {
            var admin = http.GetAdminSession().Admin;

            var json = TakeCeremony(cache, "register", request.RequestId);
            if (json is null)
            {
                return Results.BadRequest("操作逾時，請再按一次「綁定這台裝置」");
            }

            var options = CredentialCreateOptions.FromJson(json);
            // 確認這份選項是發給目前登入的這個人的
            if (!options.User.Id.AsSpan().SequenceEqual(admin.AdminID.ToByteArray()))
            {
                return Results.BadRequest("請重新操作");
            }

            try
            {
                // 函式庫負責驗證：挑戰碼是不是我們發的、網域對不對、資料格式和簽章是否正確
                var credential = await fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
                {
                    AttestationResponse = request.Response,
                    OriginalOptions = options,
                    IsCredentialIdUniqueToUserCallback = async (args, token) =>
                        !await db.AdminPasskeys.AnyAsync(p => p.AdminPasskeyCredentialId == args.CredentialId, token),
                }, ct);

                var deviceName = request.DeviceName?.Trim();
                var passkey = new AdminPasskey
                {
                    AdminPasskeyID = Guid.NewGuid(),
                    AdminID = admin.AdminID,
                    AdminPasskeyCredentialId = credential.Id,
                    AdminPasskeyPublicKey = credential.PublicKey,
                    AdminPasskeySignCount = credential.SignCount,
                    AdminPasskeyDeviceName = string.IsNullOrEmpty(deviceName) ? "未命名裝置" : deviceName[..Math.Min(deviceName.Length, 50)],
                    AdminPasskeyCreatedTime = DateTimeOffset.UtcNow,
                };
                db.AdminPasskeys.Add(passkey);
                await db.SaveChangesAsync(ct);

                return Results.Ok(ToItem(passkey));
            }
            catch (Fido2VerificationException ex)
            {
                return Results.BadRequest($"綁定失敗：{ex.Message}");
            }
        }).RequireAuthorization();

        //---------- 管理已綁定的裝置 ----------

        group.MapGet("", async (HttpContext http, AppDbContext db) =>
        {
            var adminId = http.GetAdminSession().AdminID;
            var passkeys = await db.AdminPasskeys
                .Where(p => p.AdminID == adminId)
                .OrderBy(p => p.AdminPasskeyCreatedTime)
                .Select(p => new PasskeyItem(
                    p.AdminPasskeyID,
                    p.AdminPasskeyDeviceName,
                    p.AdminPasskeyCreatedTime,
                    p.AdminPasskeyLastUsedTime))
                .ToListAsync();
            return Results.Ok(passkeys);
        }).RequireAuthorization();

        group.MapDelete("/{id:guid}", async (Guid id, HttpContext http, AppDbContext db) =>
        {
            var adminId = http.GetAdminSession().AdminID;
            // 只能刪除自己的裝置
            var passkey = await db.AdminPasskeys.FirstOrDefaultAsync(p => p.AdminPasskeyID == id && p.AdminID == adminId);
            if (passkey is null)
            {
                return Results.NotFound();
            }

            db.AdminPasskeys.Remove(passkey);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        //---------- 登入（不需要登入，所以要限制次數） ----------

        group.MapPost("/login/options", (IFido2 fido2, IMemoryCache cache) =>
        {
            var options = fido2.GetAssertionOptions(new GetAssertionOptionsParams
            {
                // 不指定裝置：瀏覽器會列出這個網站所有可用的 Passkey，使用者不用先輸入帳號
                AllowedCredentials = [],
                UserVerification = UserVerificationRequirement.Required,
            });

            return Results.Ok(StartCeremony(cache, "login", options.ToJson()));
        }).RequireRateLimiting(LoginRateLimitPolicy);

        group.MapPost("/login", async (
            PasskeyLoginRequest request,
            AppDbContext db,
            IFido2 fido2,
            IMemoryCache cache,
            AdminSessionService sessions,
            IOptions<AuthOptions> authOptions,
            IHostEnvironment env,
            HttpContext http,
            CancellationToken ct) =>
        {
            var json = TakeCeremony(cache, "login", request.RequestId);
            if (json is null)
            {
                return Results.BadRequest("操作逾時，請再試一次");
            }

            var options = AssertionOptions.FromJson(json);

            // 用憑證 ID 找出是哪一台裝置、哪個管理員
            var credentialId = request.Response.RawId;
            var passkey = await db.AdminPasskeys
                .Include(p => p.Admin)
                .FirstOrDefaultAsync(p => p.AdminPasskeyCredentialId == credentialId, ct);
            if (passkey is null)
            {
                return Results.BadRequest("這台裝置還沒有綁定，請先用密碼登入，再到「指紋登入」頁面綁定");
            }

            try
            {
                // 函式庫用存下來的公鑰驗證簽章：只有綁定時那台裝置的私鑰簽得出來
                var result = await fido2.MakeAssertionAsync(new MakeAssertionParams
                {
                    AssertionResponse = request.Response,
                    OriginalOptions = options,
                    StoredPublicKey = passkey.AdminPasskeyPublicKey,
                    StoredSignatureCounter = (uint)passkey.AdminPasskeySignCount,
                    // 確認裝置送回來的使用者 ID 真的是這個憑證的主人
                    IsUserHandleOwnerOfCredentialIdCallback = (args, _) => Task.FromResult(
                        args.UserHandle.AsSpan().SequenceEqual(passkey.AdminID.ToByteArray())
                        && args.CredentialId.AsSpan().SequenceEqual(passkey.AdminPasskeyCredentialId)),
                }, ct);

                passkey.AdminPasskeySignCount = result.SignCount;
                passkey.AdminPasskeyLastUsedTime = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync(ct);
            }
            catch (Fido2VerificationException)
            {
                return Results.Unauthorized();
            }

            // 驗證通過：跟密碼登入一樣建立 Session、設定 cookie
            var (token, session) = await sessions.CreateAsync(passkey.Admin);
            http.Response.Cookies.Append(authOptions.Value.CookieName, token, AuthEndpoints.CreateCookieOptions(env));
            return Results.Ok(AuthEndpoints.ToSessionInfo(session, sessions));
        }).RequireRateLimiting(LoginRateLimitPolicy);
    }

    // 把選項存在記憶體 5 分鐘，回傳編號給瀏覽器；第二步用編號找回當初的選項（裡面有挑戰碼）
    private static PasskeyCeremony StartCeremony(IMemoryCache cache, string kind, string optionsJson)
    {
        var requestId = Guid.NewGuid().ToString("N");
        cache.Set(CacheKey(kind, requestId), optionsJson, CeremonyTimeout);
        return new PasskeyCeremony(requestId, JsonSerializer.Deserialize<JsonElement>(optionsJson));
    }

    // 取出後馬上刪除：每個挑戰碼只能用一次，被攔截的舊請求不能重送（防重放攻擊）
    private static string? TakeCeremony(IMemoryCache cache, string kind, string? requestId)
    {
        if (string.IsNullOrEmpty(requestId)) return null;
        var key = CacheKey(kind, requestId);
        if (!cache.TryGetValue(key, out string? json)) return null;
        cache.Remove(key);
        return json;
    }

    private static string CacheKey(string kind, string requestId) => $"passkey:{kind}:{requestId}";

    private static PasskeyItem ToItem(AdminPasskey p) => new(
        p.AdminPasskeyID,
        p.AdminPasskeyDeviceName,
        p.AdminPasskeyCreatedTime,
        p.AdminPasskeyLastUsedTime);
}
