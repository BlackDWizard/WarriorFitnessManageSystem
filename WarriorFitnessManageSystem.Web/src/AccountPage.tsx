import { useEffect, useState } from 'react'
import { deletePasskey, fetchPasskeys, guessDeviceName, passkeySupported, registerPasskey } from './passkeys'
import type { PasskeyItem } from './types'

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-TW', { hour12: false }) : '從未使用'
}

export default function AccountPage() {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceName, setDeviceName] = useState(guessDeviceName)
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPasskeys()
      .then(setPasskeys)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRegister() {
    setRegistering(true)
    setError('')
    setMessage('')
    try {
      const created = await registerPasskey(deviceName.trim() || guessDeviceName())
      setPasskeys(prev => [...prev, created])
      setMessage(`「${created.deviceName}」綁定完成，下次登入可以直接按「用指紋登入」。`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRegistering(false)
    }
  }

  async function handleDelete(passkey: PasskeyItem) {
    if (!confirm(`確定要移除「${passkey.deviceName}」嗎？移除後這台裝置就不能用指紋登入。`)) return
    setError('')
    try {
      await deletePasskey(passkey.id)
      setPasskeys(prev => prev.filter(p => p.id !== passkey.id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>指紋登入</h2>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {message && <p className="alert alert-success" role="status">{message}</p>}

      <section className="card form">
        <h3 style={{ margin: 0 }}>綁定這台裝置</h3>
        {passkeySupported ? (
          <>
            <p className="muted" style={{ margin: 0 }}>
              綁定後，在這台裝置登入時按「用指紋登入」，驗證指紋、Face ID 或 Windows Hello 就能登入，不用輸入密碼。
              每台裝置要各自綁定一次。
            </p>
            <label className="field">
              <span className="field-label">裝置名稱（方便之後辨認）</span>
              <input value={deviceName} maxLength={50} onChange={e => setDeviceName(e.target.value)} />
            </label>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" disabled={registering} onClick={handleRegister}>
                {registering ? '請在跳出的視窗完成驗證...' : '綁定這台裝置'}
              </button>
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>這個瀏覽器不支援指紋登入，請改用較新版本的 Chrome、Safari 或 Edge。</p>
        )}
      </section>

      <div className="list-header">
        <h3>已綁定的裝置（{passkeys.length}）</h3>
      </div>

      {loading ? (
        <p className="loading">載入中...</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>裝置名稱</th><th>綁定時間</th><th>最後使用</th><th></th></tr>
            </thead>
            <tbody>
              {passkeys.map(p => (
                <tr key={p.id}>
                  <td>{p.deviceName}</td>
                  <td>{formatTime(p.createdTime)}</td>
                  <td>{formatTime(p.lastUsedTime)}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>移除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {passkeys.length === 0 && <p className="empty">還沒有綁定任何裝置</p>}
        </div>
      )}
    </>
  )
}
