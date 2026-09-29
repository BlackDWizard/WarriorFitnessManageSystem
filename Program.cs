using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseLowerCaseNamingConvention());

// 新增這兩行：註冊 Swagger 服務
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 新增這段：只在開發環境啟用 Swagger UI（正式環境不開放，避免洩漏 API 結構）
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => "Hello World!");
app.MapMemberEndpoints();

app.Run();