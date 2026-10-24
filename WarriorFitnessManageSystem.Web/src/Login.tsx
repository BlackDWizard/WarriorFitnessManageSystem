import { useState, type FormEvent } from 'react'
import { login } from './auth'
import { loginWithPasskey, passkeySupported } from './passkeys'
import styles from './Login.module.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handlePasskey() {
    setError('')
    setSubmitting(true)
    try {
      await loginWithPasskey()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

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
        <img src="/logo.png" alt="" className={styles.logo} />
        <p className={styles.brand}>Warrior Fitness</p>
        <h1 className={styles.title}>管理員登入</h1>

        {error && <p className="alert alert-error" role="alert">{error}</p>}

        {/* 瀏覽器支援才顯示：按下去會跳出系統的指紋／Face ID 視窗，不用輸入帳號密碼 */}
        {passkeySupported && (
          <>
            <button type="button" className={`btn btn-primary ${styles.passkeyButton}`} disabled={submitting} onClick={handlePasskey}>
              用指紋 / Face ID 登入
            </button>
            <p className={styles.divider}>或使用帳號密碼</p>
          </>
        )}

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

        <button type="submit" className={passkeySupported ? 'btn' : 'btn btn-primary'} disabled={submitting}>
          {submitting ? '登入中...' : '登入'}
        </button>
      </form>
    </div>
  )
}
