namespace WarriorFitnessManageSystem.Api.Data.Dtos;

public record OrderListItem(
    Guid OrderID,
    string? MemberName,
    string? CustomerName,
    string OrderType,
    string? OrderDescription,
    decimal OrderAmount,
    string OrderStatus,
    DateTimeOffset? OrderPaidTime,
    DateTimeOffset OrderCreatedTime,
    string? PaymentUrl
);