using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class ReportEndpoints
{
    private static readonly TimeSpan TaiwanOffset = TimeSpan.FromHours(8);

    public static RouteGroupBuilder MapReportEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/reports");

        group.MapGet("/monthly", async (int year, int month, AppDbContext db) =>
        {
            if (year < 2000 || year > 2100 || month < 1 || month > 12)
            {
                return Results.BadRequest("年份或月份不正確");
            }

            var monthStart = new DateTimeOffset(year, month, 1, 0, 0, 0, TaiwanOffset);
            var startUtc = monthStart.ToUniversalTime();
            var endUtc = monthStart.AddMonths(1).ToUniversalTime();

            var byType = await db.Orders
                .Where(o => o.OrderStatus == "Paid"
                         && o.OrderPaidTime >= startUtc
                         && o.OrderPaidTime < endUtc)
                .GroupBy(o => o.OrderType)
                .Select(g => new
                {
                    OrderType = g.Key,
                    Count = g.Count(),
                    Amount = g.Sum(o => o.OrderAmount)
                })
                .ToListAsync();

            var totalAmount = byType.Sum(x => x.Amount);
            var totalCount = byType.Sum(x => x.Count);

            var summaries = byType
                .OrderByDescending(x => x.Amount)
                .Select(x => new OrderTypeSummary(
                    x.OrderType,
                    x.Count,
                    x.Amount,
                    totalAmount == 0 ? 0 : Math.Round(x.Amount / totalAmount * 100, 1)))
                .ToList();

            return Results.Ok(new MonthlyReport(year, month, totalAmount, totalCount, summaries));
        });

        group.MapGet("/expiring-members", async (AppDbContext db, int? days) =>
        {
            var range = days ?? 3;
            if (range < 0 || range > 60)
            {
                return Results.BadRequest("天數必須介於 0 到 60");
            }

            var today = DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TaiwanOffset).DateTime);
            var until = today.AddDays(range);

            var members = await db.Members
                .Where(m => m.MemberStatus == "Active"
                        && m.MemberValidUntil != null
                        && m.MemberValidUntil >= today
                        && m.MemberValidUntil <= until)
                .OrderBy(m => m.MemberValidUntil)
                .ToListAsync();

            var result = members.Select(m => new ExpiringMember(
                m.MemberID,
                m.MemberName,
                m.MemberPhoneNo,
                m.MemberValidUntil!.Value,
                m.MemberValidUntil.Value.DayNumber - today.DayNumber));

            return Results.Ok(result);
        });

        return group;
    }
}