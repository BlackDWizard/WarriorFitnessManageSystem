namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class Admin
{
    public Guid AdminID { get; set; }
    public string AdminUsername { get; set; } = string.Empty;
    public string AdminPasswordHash { get; set; } = string.Empty;
    public string? AdminDisplayName { get; set; }
    public DateTimeOffset AdminCreatedTime { get; set; }
    public DateTimeOffset AdminModifiedTime { get; set; }
}