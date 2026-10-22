import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { FaBars, FaXmark } from 'react-icons/fa6'
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
  menuOpen: boolean
  onMenuToggle: () => void
}

export default function AdminHeader({ displayName, expiresAt, menuOpen, onMenuToggle }: Props) {
  const navigate = useNavigate()

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

  // 主動登出：網址改回會員列表，下一個人登入就從首頁開始
  // 逾時登出不走這裡，重新登入後會留在原本的頁面
  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className={styles.bar}>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={menuOpen}
        aria-controls="admin-sidebar"
        aria-label={menuOpen ? '關閉選單' : '開啟選單'}
        onClick={onMenuToggle}
      >
        {menuOpen ? <FaXmark aria-hidden="true" size={18} /> : <FaBars aria-hidden="true" size={18} />}
      </button>

      <div className={styles.session}>
        <span className={styles.name}>{displayName}</span>
        <span className={warning ? `${styles.timer} ${styles.timerWarning}` : styles.timer}>
          自動登出 {formatRemaining(remaining)}
        </span>
        <button type="button" className="btn btn-sm" onClick={() => refreshSession().catch(() => {})}>
          延長
        </button>
        <button type="button" className="btn btn-sm" onClick={() => void handleLogout()}>
          登出
        </button>
      </div>

      {/* 只在進入最後一分鐘時出現一次，螢幕報讀器會唸出來；倒數本身每秒變動，不適合一直唸 */}
      {warning && (
        <p role="alert" className={styles.alert}>
          一分鐘內沒有操作將自動登出，請按「延長」。
        </p>
      )}
    </header>
  )
}