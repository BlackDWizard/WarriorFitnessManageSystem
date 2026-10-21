import { useState, type FormEvent } from 'react'
import { API_BASE, setToken } from './api'


export default function Login({ onLogin }: { onLogin: () => void }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError('')

        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        })

        if (res.status === 401) {
            setError('帳號或密碼錯誤')
            return
        }
        if (!res.ok) {
            setError(`登入失敗（HTTP ${res.status}）`)
            return
        }

        const data: { token: string } = await res.json()
        setToken(data.token)
        onLogin()
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>管理員登入</h2>
            <input placeholder="帳號" value={username} onChange={e => setUsername(e.target.value)} />
            <input type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit">登入</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    )
}