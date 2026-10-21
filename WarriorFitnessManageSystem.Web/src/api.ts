const TOKEN_KEY = 'token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error('登入已失效，請重新登入')
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