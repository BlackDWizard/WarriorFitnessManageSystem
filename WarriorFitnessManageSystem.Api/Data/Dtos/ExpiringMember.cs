namespace WarriorFitnessManageSystem.Api.Data.Dtos;

public record ExpiringMember(
    Guid MemberID,
    string MemberName,
    string? MemberPhoneNo,
    DateOnly MemberValidUntil,
    int DaysLeft
);