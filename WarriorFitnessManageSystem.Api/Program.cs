using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
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
builder.Services.Configure<AuthOptions>(
    builder.Configuration.GetSection("Auth"));
builder.Services.AddScoped<AdminAuthService>();

//JWT 驗證機制
var authOptions = builder.Configuration.GetSection("Auth").Get<AuthOptions>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = authOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = authOptions.Issuer,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.SigningKey))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "請輸入：Bearer {你的token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            new List<string>()
        }
    });
});

var app = builder.Build();

//只在開發環境啟用 Swagger UI（正式環境不開放，避免洩漏 API 結構）
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//驗證 middleware（順序很重要，一定要在 MapXxxEndpoints 之前）
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!");
app.MapAuthEndpoints();

app.MapMemberEndpoints().RequireAuthorization();
app.MapOrderEndpoints().RequireAuthorization();
app.MapReportEndpoints().RequireAuthorization();

app.MapPaymentEndpoints();

app.Run();