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

            if (string.IsNullOrEmpty(tradeInfo) || string.IsNullOrEmpty(tradeSha))
            {
                logger.LogWarning("藍新通知缺少 TradeInfo 或 TradeSha");
                return Results.BadRequest();
            }

            var expectedSha = crypto.GenerateTradeSha(tradeInfo);
            if (!string.Equals(expectedSha, tradeSha, StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("藍新通知簽章驗證失敗");
                return Results.BadRequest();
            }

            var decryptedJson = crypto.DecryptTradeInfo(tradeInfo);
            using var doc = JsonDocument.Parse(decryptedJson);
            var root = doc.RootElement;
            var status = root.GetProperty("Status").GetString();
            var result = root.GetProperty("Result");
            var merchantOrderNo = result.GetProperty("MerchantOrderNo").GetString();

            var order = await db.Orders.FirstOrDefaultAsync(o => o.OrderGatewayTradeNo == merchantOrderNo);
            if (order is null)
            {
                logger.LogWarning("找不到對應訂單，MerchantOrderNo: {MerchantOrderNo}", merchantOrderNo);
                return Results.Ok();
            }

            // 不論結果都留下原始紀錄，供日後對帳
            db.PaymentRecords.Add(new PaymentRecord
            {
                PaymentRecordID = Guid.NewGuid(),
                OrderID = order.OrderID,
                PaymentRecordGatewayRawPayload = decryptedJson,
                PaymentRecordReceivedTime = DateTimeOffset.UtcNow,
                PaymentRecordCreatedTime = DateTimeOffset.UtcNow,
                PaymentRecordModifiedTime = DateTimeOffset.UtcNow
            });

            if (order.OrderStatus == "Paid")
            {
                logger.LogInformation("訂單 {OrderID} 已付款，忽略重複通知", order.OrderID);
            }
            else if (status == "SUCCESS")
            {
                var paidAmount = result.GetProperty("Amt").GetInt32();
                
                if (paidAmount != (int)order.OrderAmount)
                {
                    logger.LogError("付款金額不符，訂單 {OrderID} 應付 {Expected}，實付 {Actual}",
                        order.OrderID, order.OrderAmount, paidAmount);
                    order.OrderStatus = "Failed";
                }
                else
                {
                    order.OrderStatus = "Paid";
                    order.OrderPaidTime = DateTimeOffset.UtcNow;
                }
                order.OrderModifiedTime = DateTimeOffset.UtcNow;
            }
            else
            {
                order.OrderStatus = "Failed";
                order.OrderModifiedTime = DateTimeOffset.UtcNow;
            }

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