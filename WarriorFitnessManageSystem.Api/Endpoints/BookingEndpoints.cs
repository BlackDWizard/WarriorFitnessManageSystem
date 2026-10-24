using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Services;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class BookingEndpoints
{
    public const string PublicFormRateLimitPolicy = "public-form";

    private static readonly TimeSpan TaiwanOffset = TimeSpan.FromHours(8);

    // 前台：任何人都能送出，所以要限制次數、擋機器人
    public static RouteGroupBuilder MapPublicBookingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/public/bookings");

        group.MapPost("", async (CreateBookingRequest request, AppDbContext db) =>
        {
            // 隱藏欄位有值：一定是機器人。假裝成功，不讓它知道被擋了，也不存進資料庫
            if (!string.IsNullOrEmpty(request.Website))
            {
                return Results.Ok(new { received = true });
            }

            var now = DateTimeOffset.UtcNow;
            var todayInTaiwan = DateOnly.FromDateTime(now.ToOffset(TaiwanOffset).DateTime);
            var error = BookingRules.Validate(request, todayInTaiwan);
            if (error is not null)
            {
                return Results.BadRequest(error);
            }

            // 偏好教練：「不指定」，或目前在前台顯示中的教練姓名
            var preferredCoach = request.PreferredCoach!.Trim();
            if (preferredCoach != BookingRules.NoPreferredCoach
                && !await db.Coaches.AnyAsync(c => c.CoachIsVisible && c.CoachName == preferredCoach))
            {
                return Results.BadRequest("請重新選擇偏好的教練");
            }

            var booking = new Booking
            {
                BookingID = Guid.NewGuid(),
                BookingSource = request.Source!,
                BookingCourse = request.Course!,
                BookingGoal = request.Goal!,
                // 沒選「其他」就不存說明，避免留下切換選項前打的字
                BookingGoalOther = request.Goal == BookingRules.OtherGoal ? request.GoalOther!.Trim() : string.Empty,
                BookingHealthNotes = request.HealthNotes!.Trim(),
                BookingName = request.Name!.Trim(),
                BookingGender = request.Gender!,
                BookingBirthday = request.Birthday!.Value,
                BookingPhone = BookingRules.NormalizePhone(request.Phone),
                BookingEmail = request.Email!.Trim(),
                BookingLineId = request.LineId!.Trim(),
                BookingContactMethod = request.ContactMethod!,
                BookingPreferredTime = request.PreferredTime!.Trim(),
                BookingHadCoachBefore = request.HadCoachBefore!.Value,
                BookingPreferredCoach = preferredCoach,
                BookingHelpNotes = request.HelpNotes?.Trim() ?? string.Empty,
                BookingConsentTime = now,
                BookingCreatedTime = now,
                BookingModifiedTime = now,
            };

            db.Bookings.Add(booking);
            await db.SaveChangesAsync();

            // 不回傳任何資料：前台只需要知道成功了
            return Results.Ok(new { received = true });
        })
        // 同一個 IP 在一段時間內只能送出幾次（設定在 Program.cs）
        .RequireRateLimiting(PublicFormRateLimitPolicy);

        return group;
    }

    // 後台：需要登入
    public static RouteGroupBuilder MapBookingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/bookings");

        //清單：status = pending（未聯絡）、handled（已聯絡）、其他（全部）
        group.MapGet("", async (string? status, AppDbContext db) =>
        {
            var query = db.Bookings.AsQueryable();
            if (status == "pending") query = query.Where(b => b.BookingHandledTime == null);
            if (status == "handled") query = query.Where(b => b.BookingHandledTime != null);

            var bookings = await query
                .OrderByDescending(b => b.BookingCreatedTime)
                .Select(b => new BookingListItem(
                    b.BookingID,
                    b.BookingCreatedTime,
                    b.BookingName,
                    b.BookingCourse,
                    b.BookingPhone,
                    b.BookingContactMethod,
                    b.BookingPreferredTime,
                    b.BookingHandledTime != null))
                .ToListAsync();

            return Results.Ok(bookings);
        });

        //明細
        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var b = await db.Bookings.FindAsync(id);
            return b is null ? Results.NotFound() : Results.Ok(ToDetail(b));
        });

        //標記為已聯絡／改回未聯絡
        group.MapPut("/{id:guid}/handled", async (Guid id, UpdateBookingHandledRequest request, AppDbContext db) =>
        {
            var b = await db.Bookings.FindAsync(id);
            if (b is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            // 已經是已聯絡又再按一次，保留第一次的時間
            b.BookingHandledTime = request.Handled ? b.BookingHandledTime ?? now : null;
            b.BookingModifiedTime = now;
            await db.SaveChangesAsync();

            return Results.Ok(ToDetail(b));
        });

        //刪除：用在測試資料、或明顯是亂填的
        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var b = await db.Bookings.FindAsync(id);
            if (b is null)
            {
                return Results.NotFound();
            }

            db.Bookings.Remove(b);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return group;
    }

    private static BookingDetail ToDetail(Booking b) => new(
        b.BookingID,
        b.BookingCreatedTime,
        b.BookingSource,
        b.BookingCourse,
        b.BookingGoal,
        b.BookingGoalOther,
        b.BookingHealthNotes,
        b.BookingName,
        b.BookingGender,
        b.BookingBirthday,
        b.BookingPhone,
        b.BookingEmail,
        b.BookingLineId,
        b.BookingContactMethod,
        b.BookingPreferredTime,
        b.BookingHadCoachBefore,
        b.BookingPreferredCoach,
        b.BookingHelpNotes,
        b.BookingHandledTime);
}
