namespace WarriorFitnessManageSystem.Api.Services;

public record ImageFileType(string ContentType, string Extension);

// 讀檔案開頭的幾個位元組（magic bytes）判斷真正的格式
// 不相信副檔名，也不相信瀏覽器送來的 Content-Type，那些都可以隨便改
public static class ImageFileInspector
{
    // 判斷格式最多需要讀的位元組數（WebP 要看到第 12 個位元組）
    public const int HeaderLength = 12;

    private static readonly ImageFileType Jpeg = new("image/jpeg", "jpg");
    private static readonly ImageFileType Png = new("image/png", "png");
    private static readonly ImageFileType WebP = new("image/webp", "webp");

    public static ImageFileType? Detect(ReadOnlySpan<byte> header)
    {
        // JPEG：FF D8 FF
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            return Jpeg;
        }

        // PNG：固定的 8 個位元組
        if (header.Length >= 8 && header[..8].SequenceEqual(PngSignature))
        {
            return Png;
        }

        // WebP：開頭是 "RIFF"，第 8～11 個位元組是 "WEBP"（中間 4 個位元組是檔案大小）
        if (header.Length >= 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8))
        {
            return WebP;
        }

        return null;
    }

    private static ReadOnlySpan<byte> PngSignature => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
}