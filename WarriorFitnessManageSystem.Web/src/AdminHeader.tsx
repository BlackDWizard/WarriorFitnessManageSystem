import { useEffect, useState } from 'react'
import { logout, refreshSession } from './auth'
import { markSignedOut } from './session'
import styles from './AdminHeader.module.css'

const WARNING_SECONDS = 60

function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

type Props = {
  displayName: string
  expiresAt: number
}

export default function AdminHeader({ displayName, expiresAt }: Props) {
  // 每秒更新一次「現在時間」，剩餘秒數由它算出來，不另外存 state
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const warning = remaining <= WARNING_SECONDS

  // 倒數到 0：伺服器那邊也已經過期了，直接回登入畫面
  useEffect(() => {
    if (remaining === 0) markSignedOut()
  }, [remaining])

  return (
    <header className={styles.bar}>
      <span className={styles.name}>{displayName}</span>

      <span className={warning ? `${styles.timer} ${styles.timerWarning}` : styles.timer}>
        自動登出倒數 {formatRemaining(remaining)}
      </span>

      <button type="button" onClick={() => refreshSession().catch(() => {})}>
        延長登入
      </button>
      <button type="button" onClick={() => void logout()}>
        登出
      </button>

      {/* 只在進入最後一分鐘時出現一次，螢幕報讀器會唸出來；倒數本身每秒變動，不適合一直唸 */}
      {warning && (
        <p role="alert" className={styles.alert}>
          一分鐘內沒有操作將自動登出，請按「延長登入」。
        </p>
      )}
    </header>
  )
}