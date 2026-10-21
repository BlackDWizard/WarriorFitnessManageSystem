namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class Order
{
    public Guid OrderID { get; set; }
    public Guid? MemberID { get; set; }
    public string? CustomerName { get; set; }
    public string OrderType { get; set; } = string.Empty;
    public string? OrderDescription { get; set; }
    public decimal OrderAmount { get; set; }
    public string OrderGateway { get; set; } = "Newebpay";
    public string? OrderGatewayTradeNo { get; set; }
    public string OrderStatus { get; set; } = "Pending";
    public DateTimeOffset? OrderPaidTime { get; set; }
    public DateTimeOffset OrderCreatedTime { get; set; }
    public DateTimeOffset OrderModifiedTime { get; set; }

    // Navigation property
    public Member? Member { get; set; }
}