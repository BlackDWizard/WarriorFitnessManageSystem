using Microsoft.AspNetCore.Identity;
using WarriorFitnessManageSystem.Api.Data.Entities;

namespace WarriorFitnessManageSystem.Api.Services;

// 只負責密碼雜湊與驗證；登入狀態改由 AdminSessionService 管理
public class AdminAuthService
{
    private readonly PasswordHasher<Admin> _passwordHasher = new();

    public string HashPassword(Admin admin, string plainPassword)
        => _passwordHasher.HashPassword(admin, plainPassword);

    public bool VerifyPassword(Admin admin, string plainPassword)
    {
        var result = _passwordHasher.VerifyHashedPassword(admin, admin.AdminPasswordHash, plainPassword);
        return result == PasswordVerificationResult.Success;
    }
}