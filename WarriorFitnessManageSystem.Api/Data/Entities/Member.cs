namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class Member
{
    public Guid MemberID { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string? MemberPhoneNo { get; set; }
    public string? MemberEmail { get; set; }
    public string? MemberType { get; set; }
    public decimal? MemberPaidAmount { get; set; }
    public DateOnly? MemberValidUntil { get; set; }
    public string MemberStatus { get; set; } = "Active";
    public string? MemberRemark { get; set; }
    public DateTimeOffset MemberCreatedTime { get; set; }
    public DateTimeOffset MemberModifiedTime { get; set; }
}