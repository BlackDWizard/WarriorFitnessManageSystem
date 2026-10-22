import { useState, type FormEvent } from 'react'
import { login } from './auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      // 成功後 session store 變成 signedIn，AdminApp 會自動切換畫面，這裡不用做任何事
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>管理員登入</h2>
      <input placeholder="帳號" value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={submitting}>{submitting ? '登入中...' : '登入'}</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}