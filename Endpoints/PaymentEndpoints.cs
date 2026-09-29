using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this WebApplication app)
    {
        // 背景通知（藍新伺服器直接呼叫，唯一可信的付款結果來源）
        app.MapPost("/api/payments/notify", async (
    HttpRequest request,
    AppDbContext db,
    NewebPayCryptoService crypto,
    ILogger<Program> logger) =>
        {
            var form = await request.ReadFormAsync();
            var tradeInfo = form["TradeInfo"].ToString();
            var tradeSha = form["TradeSha"].ToString();

            logger.LogInformation("[Notify] TradeInfo 長度: {Length}", tradeInfo.Length);
            logger.LogInformation("[Notify] TradeInfo 前20碼: {Prefix}", tradeInfo[..Math.Min(20, tradeInfo.Length)]);
            logger.LogInformation("[Notify] TradeSha: {TradeSha}", tradeSha);

            if (string.IsNullOrEmpty(tradeInfo) || string.IsNullOrEmpty(tradeSha))
            {
                logger.LogWarning("[Notify] TradeInfo 或 TradeSha 是空的！");
                return Results.BadRequest("缺少必要參數");
            }

            var expectedSha = crypto.GenerateTradeSha(tradeInfo);
            logger.LogInformation("[Notify] 我方算出的 Sha: {ExpectedSha}", expectedSha);
            logger.LogInformation("[Notify] 簽章是否相符: {IsMatch}",
                string.Equals(expectedSha, tradeSha, StringComparison.OrdinalIgnoreCase));

            if (!string.Equals(expectedSha, tradeSha, StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest("簽章驗證失敗");
            }

            var decryptedJson = crypto.DecryptTradeInfo(tradeInfo);

            using var doc = JsonDocument.Parse(decryptedJson);
            var root = doc.RootElement;
            var status = root.GetProperty("Status").GetString();
            var result = root.GetProperty("Result");
            var merchantOrderNo = result.GetProperty("MerchantOrderNo").GetString();

            // 用之前存的 OrderGatewayTradeNo 找回對應的訂單
            var order = await db.Orders
                .FirstOrDefaultAsync(o => o.OrderGatewayTradeNo == merchantOrderNo);

            if (order is null)
            {
                // 收到通知但找不到對應訂單，記錄下來但不報錯（避免藍新一直重試）
                return Results.Ok();
            }

            // 不論成功失敗，都把原始通知內容存進 payment_records 做為稽核紀錄
            var paymentRecord = new PaymentRecord
            {
                PaymentRecordID = Guid.NewGuid(),
                OrderID = order.OrderID,
                PaymentRecordGatewayRawPayload = decryptedJson,
                PaymentRecordReceivedTime = DateTimeOffset.UtcNow,
                PaymentRecordCreatedTime = DateTimeOffset.UtcNow,
                PaymentRecordModifiedTime = DateTimeOffset.UtcNow
            };
            db.PaymentRecords.Add(paymentRecord);

            if (status == "SUCCESS")
            {
                order.OrderStatus = "Paid";
                order.OrderPaidTime = DateTimeOffset.UtcNow;
            }
            else
            {
                order.OrderStatus = "Failed";
            }
            order.OrderModifiedTime = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok();
        });

        // 前台返回頁面（使用者付款完成後，瀏覽器被導回這裡；只做顯示用，不可信任）
        app.MapPost("/api/payments/return", async (HttpRequest request) =>
        {
            var form = await request.ReadFormAsync();
            var status = form["Status"].ToString();

            var message = status == "SUCCESS"
                ? "付款完成，感謝您的購買！"
                : "付款未完成，請重新嘗試或聯繫我們。";

            var html = $"""
                <html>
                <body>
                    <h2>{message}</h2>
                    <p>（此頁面僅供顯示，實際訂單狀態以系統紀錄為準）</p>
                </body>
                </html>
                """;

            return Results.Content(html, "text/html; charset=utf-8");
        });
    }
}