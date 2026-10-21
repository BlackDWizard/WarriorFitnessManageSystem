using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WarriorFitnessManageSystem.Api.Data.Entities;
using WarriorFitnessManageSystem.Api.Data.Options;

namespace WarriorFitnessManageSystem.Api.Services;

public class AdminAuthService
{
    private readonly PasswordHasher<Admin> _passwordHasher = new();
    private readonly AuthOptions _options;

    public AdminAuthService(IOptions<AuthOptions> options)
    {
        _options = options.Value;
    }

    public string HashPassword(Admin admin, string plainPassword)
        => _passwordHasher.HashPassword(admin, plainPassword);

    public bool VerifyPassword(Admin admin, string plainPassword)
    {
        var result = _passwordHasher.VerifyHashedPassword(admin, admin.AdminPasswordHash, plainPassword);
        return result == PasswordVerificationResult.Success;
    }

    public string GenerateToken(Admin admin)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, admin.AdminID.ToString()),
            new Claim(ClaimTypes.Name, admin.AdminUsername)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_options.ExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}