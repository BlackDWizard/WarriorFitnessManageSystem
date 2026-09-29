using System.Security.Cryptography;
using System.Text;

namespace WarriorFitnessManageSystem.Api.Services;

public class NewebPayCryptoService
{
    private readonly string _hashKey;
    private readonly string _hashIV;

    public NewebPayCryptoService(string hashKey, string hashIV)
    {
        _hashKey = hashKey;
        _hashIV = hashIV;
    }

    /// <summary>
    /// 把交易參數字典轉成 AES 加密後的 TradeInfo 字串（16進位表示）
    /// </summary>
    public string EncryptTradeInfo(Dictionary<string, string> tradeParams)
    {
        // 1. 組成 key1=value1&key2=value2 這種 query string 格式
        var queryString = string.Join("&", tradeParams.Select(kv => $"{kv.Key}={kv.Value}"));

        // 2. AES-256-CBC 加密
        using var aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(_hashKey);
        aes.IV = Encoding.UTF8.GetBytes(_hashIV);
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(queryString);
        var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        // 3. 轉成小寫 16 進位字串（藍新規定的格式）
        return Convert.ToHexString(encryptedBytes).ToLower();
    }

    /// <summary>
    /// 根據加密後的 TradeInfo，算出 SHA256 驗證碼 TradeSha
    /// </summary>
    public string GenerateTradeSha(string tradeInfoEncrypted)
    {
        var raw = $"HashKey={_hashKey}&{tradeInfoEncrypted}&HashIV={_hashIV}";

        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(raw));

        // 藍新規定這裡輸出要「大寫」
        return Convert.ToHexString(hashBytes).ToUpper();
    }

    /// <summary>
    /// 解密藍新回傳的 TradeInfo（NotifyURL 收到通知時會用到，Day 6 才會用）
    /// </summary>
    public string DecryptTradeInfo(string encryptedHex)
    {
        var encryptedBytes = Convert.FromHexString(encryptedHex);

        using var aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(_hashKey);
        aes.IV = Encoding.UTF8.GetBytes(_hashIV);
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        var decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);

        return Encoding.UTF8.GetString(decryptedBytes);
    }
}