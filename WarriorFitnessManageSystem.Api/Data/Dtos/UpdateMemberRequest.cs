namespace WarriorFitnessManageSystem.Api.Data.Dtos;

public record UpdateMemberRequest(
    string MemberName,
    string? MemberPhoneNo,
    string? MemberEmail,
    string? MemberType,
    decimal? MemberPaidAmount,
    DateOnly? MemberValidUntil,
    string? MemberRemark
);