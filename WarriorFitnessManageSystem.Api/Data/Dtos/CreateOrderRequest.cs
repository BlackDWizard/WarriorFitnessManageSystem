namespace WarriorFitnessManageSystem.Api.Data.Dtos;

public record CreateOrderRequest(
    Guid? MemberID,
    string? CustomerName,
    string OrderType,
    string? OrderDescription,
    decimal OrderAmount
);