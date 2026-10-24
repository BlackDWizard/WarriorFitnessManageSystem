using System.Text.Json;
using Fido2NetLib;

namespace WarriorFitnessManageSystem.Api.Data.Dtos;

// 綁定或登入的第一步：回傳給瀏覽器的選項，加上這次操作的編號
public record PasskeyCeremony(string RequestId, JsonElement Options);

// 綁定的第二步：瀏覽器（指紋驗證後）產生的公鑰資料
public record PasskeyRegisterRequest(string RequestId, string? DeviceName, AuthenticatorAttestationRawResponse Response);

// 登入的第二步：瀏覽器（指紋驗證後）產生的簽章
public record PasskeyLoginRequest(string RequestId, AuthenticatorAssertionRawResponse Response);

public record PasskeyItem(Guid Id, string DeviceName, DateTimeOffset CreatedTime, DateTimeOffset? LastUsedTime);
