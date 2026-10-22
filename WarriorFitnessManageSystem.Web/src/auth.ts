import { API_BASE, apiFetch } from './api'
import { markSignedIn, markSignedOut } from './session'
import type { SessionInfo } from './types'

// 開啟後台、或切回這個分頁時呼叫：cookie 是 HttpOnly，JS 看不到，只能問伺服器「我還登入著嗎」
export async function checkSession() {
  try {
    markSignedIn(await apiFetch<SessionInfo>('/api/auth/session'))
  } catch {
    markSignedOut()
  }
}

export async function login(username: string, password: string) {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new Error('無法連線到伺服器，請確認網路或稍後再試')
  }

  if (res.status === 401) throw new Error('帳號或密碼錯誤')
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new Error('伺服器沒有回應，可能正在啟動中，請稍後再試')
  }
  if (!res.ok) throw new Error(`登入失敗（HTTP ${res.status}）`)

  markSignedIn(await res.json())
}

export async function refreshSession() {
  markSignedIn(await apiFetch<SessionInfo>('/api/auth/refresh', { method: 'POST' }))
}

export async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } finally {
    // 就算網路斷了，畫面上也要登出
    markSignedOut()
  }
}