using System.Net;
using System.Net.Http.Headers;
using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data.Options;

namespace WarriorFitnessManageSystem.Api.Services;

public record UploadedFile(string Path, string Url);

// 直接呼叫 Supabase Storage 的 REST API，不另外安裝 SDK
public class SupabaseStorageService
{
    private readonly HttpClient _http;
    private readonly SupabaseStorageOptions _options;
    private readonly TimeProvider _time;

    public SupabaseStorageService(HttpClient http, IOptions<SupabaseStorageOptions> options, TimeProvider time)
    {
        _http = http;
        _options = options.Value;
        _time = time;
    }

    public async Task<UploadedFile> UploadAsync(Stream content, ImageFileType type, CancellationToken ct = default)
    {
        // 依月份分資料夾，GUID 當檔名：不會重複、猜不到，也不會有中文、空白或 ../ 這種字元
        var path = $"{_time.GetUtcNow():yyyy-MM}/{Guid.NewGuid():N}.{type.Extension}";

        using var body = new StreamContent(content);
        body.Headers.ContentType = new MediaTypeHeaderValue(type.ContentType);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"object/{_options.Bucket}/{path}")
        {
            Content = body,
        };
        // 檔名永遠不會重複、內容也不會變，可以讓瀏覽器快取一年
        request.Headers.Add("cache-control", "max-age=31536000");
        // 同名檔案已存在時不要覆蓋（理論上 GUID 不會撞名，這是保險）
        request.Headers.Add("x-upsert", "false");

        using var response = await _http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException(
                $"Supabase Storage 上傳失敗（HTTP {(int)response.StatusCode}）：{detail}");
        }

        return new UploadedFile(path, GetPublicUrl(path));
    }

    // Day 3 刪除圖片時使用
    public async Task DeleteAsync(string path, CancellationToken ct = default)
    {
        using var response = await _http.DeleteAsync($"object/{_options.Bucket}/{path}", ct);

        // 檔案本來就不存在，也當作刪除成功
        if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.NotFound)
        {
            var detail = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException(
                $"Supabase Storage 刪除失敗（HTTP {(int)response.StatusCode}）：{detail}");
        }
    }

    // 公開 bucket 的檔案網址，不需要任何金鑰就能讀取
    public string GetPublicUrl(string path)
        => $"{_options.Url.TrimEnd('/')}/storage/v1/object/public/{_options.Bucket}/{path}";
}

public static class SupabaseStorageServiceExtensions
{
    public static IServiceCollection AddSupabaseStorage(this IServiceCollection services, IConfiguration configuration)
    {
        // ValidateOnStart：沒設定網址或金鑰，API 直接啟動失敗，而不是等到有人上傳才出錯
        services.AddOptions<SupabaseStorageOptions>()
            .Bind(configuration.GetSection("Supabase"))
            .Validate(o => !string.IsNullOrWhiteSpace(o.Url) && !string.IsNullOrWhiteSpace(o.SecretKey),
                "必須設定 Supabase:Url 和 Supabase:SecretKey")
            .ValidateOnStart();

        // Typed HttpClient：由 IHttpClientFactory 管理連線，不用自己 new HttpClient
        services.AddHttpClient<SupabaseStorageService>((sp, client) =>
        {
            var options = sp.GetRequiredService<IOptions<SupabaseStorageOptions>>().Value;
            client.BaseAddress = new Uri($"{options.Url.TrimEnd('/')}/storage/v1/");

            // 新版 sb_secret_ 金鑰只放在 apikey header；
            // 舊版 service_role 是 JWT（eyJ 開頭），還要放在 Authorization header
            client.DefaultRequestHeaders.Add("apikey", options.SecretKey);
            if (options.SecretKey.StartsWith("eyJ", StringComparison.Ordinal))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.SecretKey);
            }
        });

        return services;
    }
}