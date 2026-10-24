import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import { API_BASE, apiFetch } from './api'
import { markSignedIn } from './session'
import type { PasskeyItem, SessionInfo } from './types'

// 綁定和登入都分兩步：先跟後端拿選項（裡面有一次性的挑戰碼），
// 交給瀏覽器請使用者驗證指紋，再把結果送回後端驗證
type Ceremony<T> = { requestId: string; options: T }

export const passkeySupported = browserSupportsWebAuthn()

// 瀏覽器的錯誤訊息是英文的，轉成使用者看得懂的中文
function toFriendlyError(err: unknown): Error {
  const name = (err as Error)?.name
  if (name === 'NotAllowedError') return new Error('已取消，或驗證逾時，請再試一次')
  if (name === 'InvalidStateError') return new Error('這台裝置已經綁定過了')
  if (name === 'SecurityError') return new Error('網址設定不正確，無法使用指紋登入')
  return err instanceof Error ? err : new Error('發生錯誤，請再試一次')
}

export function fetchPasskeys() {
  return apiFetch<PasskeyItem[]>('/api/auth/passkeys')
}

export function deletePasskey(id: string) {
  return apiFetch<void>(`/api/auth/passkeys/${id}`, { method: 'DELETE' })
}

// 綁定目前這台裝置（需要已經用密碼登入）
export async function registerPasskey(deviceName: string) {
  const ceremony = await apiFetch<Ceremony<PublicKeyCredentialCreationOptionsJSON>>(
    '/api/auth/passkeys/register/options',
    { method: 'POST' },
  )

  let response
  try {
    // 這一步會跳出系統的指紋／Face ID／Windows Hello 視窗
    response = await startRegistration({ optionsJSON: ceremony.options })
  } catch (err) {
    throw toFriendlyError(err)
  }

  return apiFetch<PasskeyItem>('/api/auth/passkeys/register', {
    method: 'POST',
    body: JSON.stringify({ requestId: ceremony.requestId, deviceName, response }),
  })
}

// 用指紋登入：不需要輸入帳號，瀏覽器會列出這個網站可用的 Passkey
export async function loginWithPasskey() {
  const optionsRes = await fetch(`${API_BASE}/api/auth/passkeys/login/options`, {
    method: 'POST',
    credentials: 'include',
  })
  if (optionsRes.status === 404) throw new Error('指紋登入尚未啟用，請先用帳號密碼登入')
  if (optionsRes.status === 429) throw new Error('嘗試次數太多了，請過幾分鐘再試')
  if (!optionsRes.ok) throw new Error('伺服器沒有回應，請稍後再試')
  const ceremony = (await optionsRes.json()) as Ceremony<PublicKeyCredentialRequestOptionsJSON>

  let response
  try {
    response = await startAuthentication({ optionsJSON: ceremony.options })
  } catch (err) {
    throw toFriendlyError(err)
  }

  const res = await fetch(`${API_BASE}/api/auth/passkeys/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: ceremony.requestId, response }),
  })
  if (res.status === 401) throw new Error('驗證失敗，請改用帳號密碼登入')
  if (!res.ok) {
    const text = await res.text()
    let message = '登入失敗，請改用帳號密碼登入'
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed === 'string') message = parsed
    } catch {
      // 不是 JSON 就用預設訊息
    }
    throw new Error(message)
  }

  markSignedIn((await res.json()) as SessionInfo)
}

// 依瀏覽器資訊猜一個裝置名稱，使用者可以再修改
export function guessDeviceName() {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android 手機'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows 電腦'
  return '我的裝置'
}
