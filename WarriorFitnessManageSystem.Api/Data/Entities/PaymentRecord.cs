namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class PaymentRecord
{
    public Guid PaymentRecordID { get; set; }
    public Guid? OrderID { get; set; }
    public string PaymentRecordGatewayRawPayload { get; set; } = string.Empty; // jsonb 先用 string 存
    public DateTimeOffset PaymentRecordReceivedTime { get; set; }
    public DateTimeOffset PaymentRecordCreatedTime { get; set; }
    public DateTimeOffset PaymentRecordModifiedTime { get; set; }

    // Navigation property
    public Order? Order { get; set; }
}