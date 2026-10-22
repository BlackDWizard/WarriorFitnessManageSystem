using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class SiteImageEndpoints
{
    // 後台：需要登入，可以看到隱藏的圖片、新增、修改、刪除
    public static RouteGroupBuilder MapSiteImageEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/site-images");

        //查詢某個分類的全部圖片（含隱藏的）
        group.MapGet("", async (string category, AppDbContext db, SupabaseStorageService storage) =>
        {
            if (!SiteImageRules.IsValidCategory(category))
            {
                return Results.BadRequest("圖片分類不正確");
            }

            var images = await db.SiteImages
                .Where(s => s.SiteImageCategory == category)
                .OrderBy(s => s.SiteImageSortOrder)
                .ToListAsync();

            return Results.Ok(images.Select(s => ToItem(s, storage)));
        });

        //新增：先用 /api/uploads 上傳檔案，再把拿到的路徑送來這裡建立資料
        group.MapPost("", async (CreateSiteImageRequest request, AppDbContext db, SupabaseStorageService storage) =>
        {
            if (!SiteImageRules.IsValidCategory(request.Category))
            {
                return Results.BadRequest("圖片分類不正確");
            }
            if (!SiteImageRules.IsValidStoragePath(request.StoragePath))
            {
                return Results.BadRequest("圖片路徑不正確");
            }
            var validation = ValidateFields(request.AltText, request.LinkUrl);
            if (validation is not null)
            {
                return validation;
            }

            // 新圖片排在這個分類的最後面
            var maxSort = await db.SiteImages
                .Where(s => s.SiteImageCategory == request.Category)
                .MaxAsync(s => (int?)s.SiteImageSortOrder) ?? 0;

            var now = DateTimeOffset.UtcNow;
            var image = new SiteImage
            {
                SiteImageID = Guid.NewGuid(),
                SiteImageCategory = request.Category,
                SiteImageStoragePath = request.StoragePath,
                SiteImageAltText = request.AltText?.Trim() ?? string.Empty,
                SiteImageLinkUrl = SiteImageRules.NormalizeLinkUrl(request.LinkUrl),
                SiteImageSortOrder = maxSort + 1,
                SiteImageIsVisible = true,
                SiteImageCreatedTime = now,
                SiteImageModifiedTime = now,
            };

            db.SiteImages.Add(image);
            await db.SaveChangesAsync();

            return Results.Created($"/api/site-images/{image.SiteImageID}", ToItem(image, storage));
        });

        //修改替代文字、連結、是否顯示
        group.MapPut("/{id:guid}", async (Guid id, UpdateSiteImageRequest request, AppDbContext db, SupabaseStorageService storage) =>
        {
            var image = await db.SiteImages.FindAsync(id);
            if (image is null)
            {
                return Results.NotFound();
            }
            var validation = ValidateFields(request.AltText, request.LinkUrl);
            if (validation is not null)
            {
                return validation;
            }

            image.SiteImageAltText = request.AltText?.Trim() ?? string.Empty;
            image.SiteImageLinkUrl = SiteImageRules.NormalizeLinkUrl(request.LinkUrl);
            image.SiteImageIsVisible = request.IsVisible;
            image.SiteImageModifiedTime = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(ToItem(image, storage));
        });

        //調整順序：前端送來「排好順序的整個 id 清單」，依清單位置重新編號
        group.MapPut("/reorder", async (ReorderSiteImagesRequest request, AppDbContext db) =>
        {
            if (!SiteImageRules.IsValidCategory(request.Category))
            {
                return Results.BadRequest("圖片分類不正確");
            }

            var images = await db.SiteImages
                .Where(s => s.SiteImageCategory == request.Category)
                .ToListAsync();

            // 清單必須剛好是這個分類的全部圖片：不能多、不能少、不能重複
            // 例如另一個人剛新增或刪除了圖片，這邊的畫面就是舊的，這時拒絕比亂排好
            var requestedIds = request.Ids ?? [];
            var sameSet = requestedIds.Count == images.Count
                && requestedIds.Distinct().Count() == requestedIds.Count
                && images.All(image => requestedIds.Contains(image.SiteImageID));
            if (!sameSet)
            {
                return Results.Conflict("圖片清單已經有變動，請重新整理頁面後再調整順序");
            }

            var now = DateTimeOffset.UtcNow;
            var byId = images.ToDictionary(image => image.SiteImageID);
            for (var i = 0; i < requestedIds.Count; i++)
            {
                var image = byId[requestedIds[i]];
                if (image.SiteImageSortOrder != i + 1)
                {
                    image.SiteImageSortOrder = i + 1;
                    image.SiteImageModifiedTime = now;
                }
            }

            // 一次 SaveChanges 就是一個交易：全部更新成功，或全部不更新
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        //刪除：先刪資料，再刪檔案
        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db, SupabaseStorageService storage, ILogger<SupabaseStorageService> logger) =>
        {
            var image = await db.SiteImages.FindAsync(id);
            if (image is null)
            {
                return Results.NotFound();
            }

            db.SiteImages.Remove(image);
            await db.SaveChangesAsync();

            // 檔案刪除失敗不影響結果：資料已經刪了，前台不會再顯示，只是 Storage 多一個沒人用的檔案
            try
            {
                await storage.DeleteAsync(image.SiteImageStoragePath);
            }
            catch (HttpRequestException ex)
            {
                logger.LogWarning(ex, "圖片資料已刪除，但 Storage 檔案 {Path} 刪除失敗", image.SiteImageStoragePath);
            }

            return Results.NoContent();
        });

        return group;
    }

    // 前台：不需要登入，只回傳顯示中的圖片
    public static RouteGroupBuilder MapPublicSiteImageEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/public/site-images");

        group.MapGet("", async (string category, AppDbContext db, SupabaseStorageService storage, HttpContext http) =>
        {
            if (!SiteImageRules.IsValidCategory(category))
            {
                return Results.BadRequest("圖片分類不正確");
            }

            var images = await db.SiteImages
                .Where(s => s.SiteImageCategory == category && s.SiteImageIsVisible)
                .OrderBy(s => s.SiteImageSortOrder)
                .ToListAsync();

            // 每次都向伺服器確認最新資料：教練在後台改完，前台重新整理就看得到
            http.Response.Headers.CacheControl = "no-cache";

            return Results.Ok(images.Select(s => new PublicSiteImage(
                s.SiteImageID,
                storage.GetPublicUrl(s.SiteImageStoragePath),
                s.SiteImageAltText,
                s.SiteImageLinkUrl)));
        });

        return group;
    }

    private static IResult? ValidateFields(string? altText, string? linkUrl)
    {
        if (altText is not null && altText.Trim().Length > SiteImageRules.MaxAltTextLength)
        {
            return Results.BadRequest($"替代文字不能超過 {SiteImageRules.MaxAltTextLength} 個字");
        }
        if (!SiteImageRules.IsValidLinkUrl(linkUrl))
        {
            return Results.BadRequest("連結必須是 https:// 開頭的網址，或 / 開頭的站內路徑");
        }
        return null;
    }

    private static SiteImageItem ToItem(SiteImage s, SupabaseStorageService storage) => new(
        s.SiteImageID,
        s.SiteImageCategory,
        s.SiteImageStoragePath,
        storage.GetPublicUrl(s.SiteImageStoragePath),
        s.SiteImageAltText,
        s.SiteImageLinkUrl,
        s.SiteImageSortOrder,
        s.SiteImageIsVisible);
}