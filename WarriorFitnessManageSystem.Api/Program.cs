using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Fido2NetLib;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Options;
using WarriorFitnessManageSystem.Api.Endpoints;
using WarriorFitnessManageSystem.Api.Services;

var builder = WebApplication.CreateBuilder(args);

//DB
var connectionString = builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseLowerCaseNamingConvention());

//藍新設定
builder.Services.Configure<NewebPayOptions>(builder.Configuration.GetSection("NewebPay"));
builder.Services.AddScoped(sp =>
{
    var options = sp.GetRequiredService<IOptions<NewebPayOptions>>().Value;
    return new NewebPayCryptoService(options.HashKey, options.HashIV);
});
builder.Services.Configure<AppOptions>(builder.Configuration.GetSection("App"));

//Auth 設定
builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection("Auth"));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<AdminAuthService>();
builder.Services.AddScoped<AdminSessionService>();

//Session 驗證機制：cookie 只放隨機 token，登入狀態記錄在 AdminSessions 資料表
builder.Services.AddAuthentication(SessionAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(
        SessionAuthenticationHandler.SchemeName, null);
builder.Services.AddAuthorization();

//Render 前面有一層代理伺服器：沒有這段設定，API 看到的 IP 全部都是代理伺服器的 IP，
//每個客人會被當成同一個人，限制次數就會一起被擋。從 X-Forwarded-For 取得客人真正的 IP
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Render 代理伺服器的 IP 不固定，所以不限定來源。API 只能透過 Render 的代理連到，這樣設定是安全的
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

//公開表單的送出次數限制：同一個 IP 每 10 分鐘最多 5 次
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    //指紋登入：同一個 IP 每 10 分鐘最多 20 次
    options.AddPolicy(PasskeyEndpoints.LoginRateLimitPolicy, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
            }));
    options.AddPolicy(BookingEndpoints.PublicFormRateLimitPolicy, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
            }));
});

//指紋登入（Passkey）：沒有設定 Passkey:RpId 和 Passkey:Origins 時整個功能不啟用，密碼登入完全不受影響
var passkeyOptions = builder.Configuration.GetSection("Passkey").Get<PasskeyOptions>() ?? new PasskeyOptions();
if (passkeyOptions.IsConfigured)
{
    builder.Services.AddSingleton<IFido2>(new Fido2(new Fido2Configuration
    {
        ServerDomain = passkeyOptions.RpId,
        ServerName = "Warrior Fitness 管理後台",
        Origins = new HashSet<string>(passkeyOptions.Origins),
    }));
}
//指紋登入的挑戰碼暫存在記憶體（5 分鐘）
builder.Services.AddMemoryCache();

//Supabase Storage（圖片上傳）
builder.Services.AddSupabaseStorage(builder.Configuration);

//Swagger：在 Swagger 裡呼叫 /api/auth/login 後，瀏覽器會自動帶 cookie，不用再貼 token
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var allowedOrigins = builder.Configuration.GetSection("App:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()                                              // 允許跨網域帶 cookie
        .WithExposedHeaders(SessionAuthenticationHandler.ExpiresInHeader)); // 讓前端讀得到剩餘秒數
});

var app = builder.Build();

//放在最前面：後面所有 middleware 看到的都是客人真正的 IP
app.UseForwardedHeaders();

//API 回應的安全標頭：大部分回傳 JSON，但付款頁是 HTML，一起加上
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});

//告訴瀏覽器這個網域一律用 HTTPS（本機是 http，所以開發環境不加）
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

//只在開發環境啟用 Swagger UI（正式環境不開放，避免洩漏 API 結構）
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

//驗證 middleware（順序很重要，一定要在 MapXxxEndpoints 之前）
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapGet("/", () => "Hello World!");
app.MapAuthEndpoints();
if (passkeyOptions.IsConfigured)
{
    app.MapPasskeyEndpoints();
}

app.MapMemberEndpoints().RequireAuthorization();
app.MapOrderEndpoints().RequireAuthorization();
app.MapReportEndpoints().RequireAuthorization();
app.MapUploadEndpoints().RequireAuthorization();
app.MapSiteImageEndpoints().RequireAuthorization();
app.MapCoachEndpoints().RequireAuthorization();
app.MapBookingEndpoints().RequireAuthorization();

app.MapPaymentEndpoints();

//前台用的公開 API，不需要登入
app.MapPublicSiteImageEndpoints();
app.MapPublicCoachEndpoints();
app.MapPublicBookingEndpoints();

app.Run();
