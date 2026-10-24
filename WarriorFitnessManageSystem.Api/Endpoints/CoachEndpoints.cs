using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class CoachEndpoints
{
    // 後台：需要登入
    public static RouteGroupBuilder MapCoachEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/coaches");

        //全部教練（含隱藏的），依順序排列
        group.MapGet("", async (AppDbContext db, SupabaseStorageService storage) =>
        {
            var coaches = await db.Coaches.OrderBy(c => c.CoachSortOrder).ToListAsync();
            return Results.Ok(coaches.Select(c => ToItem(c, storage)));
        });

        //單一教練（編輯頁用）
        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db, SupabaseStorageService storage) =>
        {
            var coach = await db.Coaches.FindAsync(id);
            return coach is null ? Results.NotFound() : Results.Ok(ToItem(coach, storage));
        });

        //新增
        group.MapPost("", async (SaveCoachRequest request, AppDbContext db, SupabaseStorageService storage) =>
        {
            var error = CoachRules.Validate(request);
            if (error is not null)
            {
                return Results.BadRequest(error);
            }

            var maxSort = await db.Coaches.MaxAsync(c => (int?)c.CoachSortOrder) ?? 0;
            var now = DateTimeOffset.UtcNow;
            var coach = new Coach
            {
                CoachID = Guid.NewGuid(),
                CoachSortOrder = maxSort + 1,
                CoachCreatedTime = now,
            };
            Apply(coach, request, now);

            db.Coaches.Add(coach);
            await db.SaveChangesAsync();

            return Results.Created($"/api/coaches/{coach.CoachID}", ToItem(coach, storage));
        });

        //修改：如果換了照片，存檔成功後再刪掉舊照片的檔案
        group.MapPut("/{id:guid}", async (Guid id, SaveCoachRequest request, AppDbContext db, SupabaseStorageService storage) =>
        {
            var error = CoachRules.Validate(request);
            if (error is not null)
            {
                return Results.BadRequest(error);
            }

            var coach = await db.Coaches.FindAsync(id);
            if (coach is null)
            {
                return Results.NotFound();
            }

            var oldPhotoPath = coach.CoachPhotoStoragePath;
            Apply(coach, request, DateTimeOffset.UtcNow);
            await db.SaveChangesAsync();

            if (oldPhotoPath is not null && oldPhotoPath != coach.CoachPhotoStoragePath)
            {
                await storage.TryDeleteAsync(oldPhotoPath);
            }

            return Results.Ok(ToItem(coach, storage));
        });

        //調整順序：跟網站圖片的排序是同樣的做法
        group.MapPut("/reorder", async (ReorderCoachesRequest request, AppDbContext db) =>
        {
            var coaches = await db.Coaches.ToListAsync();

            var requestedIds = request.Ids ?? [];
            var sameSet = requestedIds.Count == coaches.Count
                && requestedIds.Distinct().Count() == requestedIds.Count
                && coaches.All(c => requestedIds.Contains(c.CoachID));
            if (!sameSet)
            {
                return Results.Conflict("教練清單已經有變動，請重新整理頁面後再調整順序");
            }

            var now = DateTimeOffset.UtcNow;
            var byId = coaches.ToDictionary(c => c.CoachID);
            for (var i = 0; i < requestedIds.Count; i++)
            {
                var coach = byId[requestedIds[i]];
                if (coach.CoachSortOrder != i + 1)
                {
                    coach.CoachSortOrder = i + 1;
                    coach.CoachModifiedTime = now;
                }
            }

            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        //刪除：先刪資料，再刪照片檔案
        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db, SupabaseStorageService storage) =>
        {
            var coach = await db.Coaches.FindAsync(id);
            if (coach is null)
            {
                return Results.NotFound();
            }

            db.Coaches.Remove(coach);
            await db.SaveChangesAsync();

            if (coach.CoachPhotoStoragePath is not null)
            {
                await storage.TryDeleteAsync(coach.CoachPhotoStoragePath);
            }

            return Results.NoContent();
        });

        return group;
    }

    // 前台：不需要登入，只回傳顯示中的教練
    public static RouteGroupBuilder MapPublicCoachEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/public/coaches");

        group.MapGet("", async (AppDbContext db, SupabaseStorageService storage, HttpContext http) =>
        {
            var coaches = await db.Coaches
                .Where(c => c.CoachIsVisible)
                .OrderBy(c => c.CoachSortOrder)
                .ToListAsync();

            http.Response.Headers.CacheControl = "no-cache";

            return Results.Ok(coaches.Select(c => new PublicCoach(
                c.CoachID,
                c.CoachName,
                c.CoachTitle,
                c.CoachSpecialties,
                c.CoachBio,
                PhotoUrl(c, storage))));
        });

        return group;
    }

    // 新增和修改共用：把請求的內容整理後寫進實體
    private static void Apply(Coach coach, SaveCoachRequest request, DateTimeOffset now)
    {
        coach.CoachName = request.Name!.Trim();
        coach.CoachTitle = request.Title?.Trim() ?? string.Empty;
        coach.CoachSpecialties = CoachRules.NormalizeSpecialties(request.Specialties);
        coach.CoachBio = request.Bio?.Trim() ?? string.Empty;
        coach.CoachPhotoStoragePath = request.PhotoPath;
        coach.CoachIsVisible = request.IsVisible;
        coach.CoachModifiedTime = now;
    }

    private static string? PhotoUrl(Coach c, SupabaseStorageService storage)
        => c.CoachPhotoStoragePath is null ? null : storage.GetPublicUrl(c.CoachPhotoStoragePath);

    private static CoachItem ToItem(Coach c, SupabaseStorageService storage) => new(
        c.CoachID,
        c.CoachName,
        c.CoachTitle,
        c.CoachSpecialties,
        c.CoachBio,
        c.CoachPhotoStoragePath,
        PhotoUrl(c, storage),
        c.CoachSortOrder,
        c.CoachIsVisible);
}