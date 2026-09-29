using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class MemberEndpoints
{
    public static void MapMemberEndpoints(this WebApplication app)
    {
        app.MapGet("/api/members", async (AppDbContext db) =>
        {
            var members = await db.Members.ToListAsync();
            return Results.Ok(members);
        });

        app.MapPost("/api/members", async (CreateMemberRequest request, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.MemberName))
            {
                return Results.BadRequest("會員姓名為必填");
            }

            var member = new Member
            {
                MemberID = Guid.NewGuid(),
                MemberName = request.MemberName,
                MemberPhoneNo = request.MemberPhoneNo,
                MemberEmail = request.MemberEmail,
                MemberType = request.MemberType,
                MemberPaidAmount = request.MemberPaidAmount,
                MemberValidUntil = request.MemberValidUntil,
                MemberStatus = "Active",
                MemberRemark = request.MemberRemark,
                MemberCreatedTime = DateTimeOffset.UtcNow,
                MemberModifiedTime = DateTimeOffset.UtcNow
            };

            db.Members.Add(member);
            await db.SaveChangesAsync();

            return Results.Created($"/api/members/{member.MemberID}", member);
        });
    }
}