using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", async (
            LoginRequest request,
            AppDbContext db,
            AdminAuthService authService) =>
        {
            var admin = await db.Admins
                .FirstOrDefaultAsync(a => a.AdminUsername == request.Username);

            if (admin is null || !authService.VerifyPassword(admin, request.Password))
            {
                return Results.Unauthorized();
            }

            var token = authService.GenerateToken(admin);
            return Results.Ok(new { token });
        });

        // 首次啟用用：只有在資料庫還沒有任何管理員時才能呼叫，之後這支自動失效
        app.MapPost("/api/auth/bootstrap", async (
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
}