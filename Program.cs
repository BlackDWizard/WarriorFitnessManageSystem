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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

//只在開發環境啟用 Swagger UI（正式環境不開放，避免洩漏 API 結構）
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => "Hello World!");
app.MapMemberEndpoints();
app.MapOrderEndpoints();

app.Run();