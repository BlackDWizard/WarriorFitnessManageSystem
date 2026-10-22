import { markSignedOut, updateExpiresIn } from './session'

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    // 跨網域（admin. → api.）也要帶上 cookie；token 不再由程式手動放進 header
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 每次成功的請求都會延長 Session，伺服器用這個 header 告訴我們新的剩餘秒數
  const expiresIn = res.headers.get('X-Session-Expires-In')
  if (expiresIn !== null) updateExpiresIn(Number(expiresIn))

  if (res.status === 401) {
    markSignedOut()
    throw new Error('登入已逾時，請重新登入')
  }

  const text = await res.text()

  if (!res.ok) {
    let message = text
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed === 'string') message = parsed
    } catch {
      // 不是 JSON 就直接用原文
    }
    throw new Error(message || `HTTP ${res.status}`)
  }

  return (text ? JSON.parse(text) : undefined) as T
}