using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Data.Options;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class OrderEndpoints
{
    public static RouteGroupBuilder MapOrderEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/orders");

        group.MapPost("", async (CreateOrderRequest request, AppDbContext db) =>
        {
            if (request.OrderAmount <= 0)
            {
                return Results.BadRequest("訂單金額必須大於 0");
            }

            var order = new Order
            {
                OrderID = Guid.NewGuid(),
                MemberID = request.MemberID,
                CustomerName = request.CustomerName,
                OrderType = request.OrderType,
                OrderDescription = request.OrderDescription,
                OrderAmount = request.OrderAmount,
                OrderGateway = "Newebpay",
                OrderStatus = "Pending",
                OrderCreatedTime = DateTimeOffset.UtcNow,
                OrderModifiedTime = DateTimeOffset.UtcNow
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync();

            return Results.Created($"/api/orders/{order.OrderID}", order);
        });

        group.MapGet("/{id:guid}/payment-link", async (
            Guid id,
            AppDbContext db,
            NewebPayCryptoService crypto,
            IOptions<NewebPayOptions> newebPayOptions) =>
        {
            var order = await db.Orders.FindAsync(id);
            if (order is null)
            {
                return Results.NotFound();
            }

            var options = newebPayOptions.Value;

            // 商店訂單編號：藍新規定要唯一，用時間戳+訂單ID前8碼組合
            var merchantOrderNo = $"{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{order.OrderID:N}"[..30];

            var tradeParams = new Dictionary<string, string>
            {
                ["MerchantID"] = options.MerchantID,
                ["RespondType"] = "JSON",
                ["TimeStamp"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ["Version"] = "2.0",
                ["MerchantOrderNo"] = merchantOrderNo,
                ["Amt"] = ((int)order.OrderAmount).ToString(),
                ["ItemDesc"] = order.OrderDescription ?? "會員費用",
                ["ReturnURL"] = "https://062a-118-166-234-125.ngrok-free.app/api/payments/return",
                ["NotifyURL"] = "https://062a-118-166-234-125.ngrok-free.app/api/payments/notify"
            };

            var tradeInfo = crypto.EncryptTradeInfo(tradeParams);
            var tradeSha = crypto.GenerateTradeSha(tradeInfo);

            order.OrderGatewayTradeNo = merchantOrderNo;
            order.OrderModifiedTime = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            var html = $"""
                <html>
                <body onload="document.forms[0].submit()">
                    <form action="https://ccore.newebpay.com/MPG/mpg_gateway" method="post">
                        <input type="hidden" name="MerchantID" value="{options.MerchantID}" />
                        <input type="hidden" name="TradeInfo" value="{tradeInfo}" />
                        <input type="hidden" name="TradeSha" value="{tradeSha}" />
                        <input type="hidden" name="Version" value="2.0" />
                    </form>
                    <p>正在導向付款頁面，請稍候...</p>
                </body>
                </html>
                """;

            return Results.Content(html, "text/html; charset=utf-8");
        })
        .AllowAnonymous();

        group.MapGet("", async (AppDbContext db, string? status) =>
        {
            var query = db.Orders.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.OrderStatus == status);
            }

            var orders = await query
                .OrderByDescending(o => o.OrderCreatedTime)
                .ToListAsync();

            return Results.Ok(orders);
        });

        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var order = await db.Orders.FindAsync(id);
            return order is not null ? Results.Ok(order) : Results.NotFound();
        });

        return group;
    }
}