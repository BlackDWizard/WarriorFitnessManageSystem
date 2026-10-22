import { useState, type FormEvent } from 'react'
import { login } from './auth'
import styles from './Login.module.css'

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
    <div className={styles.page}>
      <form className={`card ${styles.card}`} onSubmit={handleSubmit}>
        <p className={styles.brand}>Warrior Fitness</p>
        <h1 className={styles.title}>管理員登入</h1>

        {error && <p className="alert alert-error" role="alert">{error}</p>}

        {/* autoComplete 讓瀏覽器的密碼管理員知道哪個欄位是帳號、哪個是密碼 */}
        <label className="field">
          <span className="field-label">帳號</span>
          <input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">密碼</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '登入中...' : '登入'}
        </button>
      </form>
    </div>
  )
}