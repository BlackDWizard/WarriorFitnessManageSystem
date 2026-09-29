using Microsoft.EntityFrameworkCore;
using WarriorFitnessManageSystem.Api.Data.Entities;

namespace WarriorFitnessManageSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Member> Members => Set<Member>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<PaymentRecord> PaymentRecords => Set<PaymentRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Member>().ToTable("members");
        modelBuilder.Entity<Order>().ToTable("orders");
        modelBuilder.Entity<PaymentRecord>().ToTable("paymentrecords");
    }
}