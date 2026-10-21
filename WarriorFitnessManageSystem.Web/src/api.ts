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
    if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`)
    }
    return res.json() as Promise<T>
}