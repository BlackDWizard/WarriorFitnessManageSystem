using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data.Options;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class UploadEndpoints
{
    public static RouteGroupBuilder MapUploadEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/uploads");

        group.MapPost("/", async (
            IFormFile? file,
            SupabaseStorageService storage,
            IOptions<SupabaseStorageOptions> options,
            ILogger<SupabaseStorageService> logger,
            CancellationToken ct) =>
        {
            if (file is null || file.Length == 0)
            {
                return Results.BadRequest("請選擇要上傳的圖片");
            }

            var maxBytes = options.Value.MaxUploadBytes;
            if (file.Length > maxBytes)
            {
                return Results.BadRequest($"圖片不能超過 {maxBytes / 1024 / 1024} MB");
            }

            await using var stream = file.OpenReadStream();

            // 先讀開頭幾個位元組判斷格式，判斷完再倒回開頭整個上傳
            var header = new byte[ImageFileInspector.HeaderLength];
            var read = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, ct);
            var type = ImageFileInspector.Detect(header.AsSpan(0, read));
            if (type is null)
            {
                return Results.BadRequest("只接受 JPG、PNG、WebP 格式的圖片");
            }
            stream.Position = 0;

            try
            {
                var uploaded = await storage.UploadAsync(stream, type, ct);
                return Results.Ok(uploaded);
            }
            catch (HttpRequestException ex)
            {
                // 詳細錯誤寫進 log；回給前端的訊息不包含 Supabase 的內部資訊
                logger.LogError(ex, "圖片上傳到 Supabase Storage 失敗");
                return Results.Json("圖片上傳失敗，請稍後再試", statusCode: StatusCodes.Status502BadGateway);
            }
        })
        // 接收表單資料的 endpoint 預設要求 antiforgery token。
        // 這裡的 CSRF 防護由 Session cookie 的 SameSite=Lax 負責（其他網站的 POST 不會帶上 cookie）
        .DisableAntiforgery();

        return group;
    }
}