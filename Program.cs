using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString).UseLowerCaseNamingConvention());

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

// 測試連線用的 API
app.MapGet("/api/members", async (AppDbContext db) =>
{
    var members = await db.Members.ToListAsync();
    return Results.Ok(members);
});


app.Run();
