using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data;
using WarriorFitnessManageSystem.Api.Data.Dtos;
using WarriorFitnessManageSystem.Api.Data.Entities;

namespace WarriorFitnessManageSystem.Api.Endpoints;

public static class MemberEndpoints
{
    public static RouteGroupBuilder MapMemberEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/members");
        //查詢全部
        group.MapGet("", async (AppDbContext db) =>
        {
            var members = await db.Members.ToListAsync();
            return Results.Ok(members);
        });

        //新增
        group.MapPost("", async (CreateMemberRequest request, AppDbContext db) =>
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

        //查詢單筆
        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var member = await db.Members.FindAsync(id);
            return member is not null ? Results.Ok(member) : Results.NotFound();
        });

        //更新
        group.MapPut("/{id:guid}", async (Guid id, UpdateMemberRequest request, AppDbContext db) =>
        {
            var member = await db.Members.FindAsync(id);
            if (member is null)
            {
                return Results.NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.MemberName))
            {
                return Results.BadRequest("會員姓名為必填");
            }

            member.MemberName = request.MemberName;
            member.MemberPhoneNo = request.MemberPhoneNo;
            member.MemberEmail = request.MemberEmail;
            member.MemberType = request.MemberType;
            member.MemberPaidAmount = request.MemberPaidAmount;
            member.MemberValidUntil = request.MemberValidUntil;
            member.MemberRemark = request.MemberRemark;
            member.MemberModifiedTime = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(member);
        });

        //停權
        group.MapPost("/{id:guid}/suspend", async (Guid id, AppDbContext db) =>
        {
            var member = await db.Members.FindAsync(id);
            if (member is null)
            {
                return Results.NotFound();
            }

            member.MemberStatus = "Suspended";
            member.MemberModifiedTime = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(member);
        });

        //啟用
        group.MapPost("/{id:guid}/activate", async (Guid id, AppDbContext db) =>
        {
            var member = await db.Members.FindAsync(id);
            if (member is null)
            {
                return Results.NotFound();
            }

            member.MemberStatus = "Active";
            member.MemberModifiedTime = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(member);
        });

        return group;
    }
}