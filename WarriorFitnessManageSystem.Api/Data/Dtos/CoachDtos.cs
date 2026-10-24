namespace WarriorFitnessManageSystem.Api.Data.Dtos;

// 新增和修改共用同一個格式
public record SaveCoachRequest(
    string? Name,
    string? Title,
    List<string>? Specialties,
    string? Bio,
    string? PhotoPath,
    bool IsVisible);

public record ReorderCoachesRequest(List<Guid>? Ids);

public record CoachItem(
    Guid Id,
    string Name,
    string Title,
    List<string> Specialties,
    string Bio,
    string? PhotoPath,
    string? PhotoUrl,
    int SortOrder,
    bool IsVisible);

public record PublicCoach(
    Guid Id,
    string Name,
    string Title,
    List<string> Specialties,
    string Bio,
    string? PhotoUrl);