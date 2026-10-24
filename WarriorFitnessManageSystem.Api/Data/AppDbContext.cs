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
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<AdminSession> AdminSessions => Set<AdminSession>();
    public DbSet<SiteImage> SiteImages => Set<SiteImage>();
    public DbSet<Coach> Coaches => Set<Coach>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Member>().ToTable("members");
        modelBuilder.Entity<Order>().ToTable("orders");
        modelBuilder.Entity<PaymentRecord>().ToTable("paymentrecords");

        modelBuilder.Entity<Admin>().ToTable("admins");

        //明確告訴 EF Core 這個欄位是 jsonb 型別
        modelBuilder.Entity<PaymentRecord>()
            .Property(p => p.PaymentRecordGatewayRawPayload)
            .HasColumnType("jsonb");

            modelBuilder.Entity<AdminSession>().ToTable("adminsessions");

        //一個管理員可以有多筆 Session（多台裝置、歷次登入）
        modelBuilder.Entity<AdminSession>()
            .HasOne(s => s.Admin)
            .WithMany()
            .HasForeignKey(s => s.AdminID);

        modelBuilder.Entity<SiteImage>().ToTable("siteimages");
        modelBuilder.Entity<Coach>().ToTable("coaches");
        modelBuilder.Entity<Booking>().ToTable("bookings");
    }
}