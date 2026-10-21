namespace WarriorFitnessManageSystem.Api.Data.Dtos;

public record OrderTypeSummary(string OrderType, int Count, decimal Amount, decimal Percentage);

public record MonthlyReport(int Year, int Month, decimal TotalAmount, int TotalCount, List<OrderTypeSummary> ByType);