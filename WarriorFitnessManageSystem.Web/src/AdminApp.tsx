import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import './admin.css'
import { checkSession } from './auth'
import { useSession } from './session'
import AdminLayout from './AdminLayout'
import Login from './Login'
import MemberList from './MemberList'
import MemberForm from './MemberForm'
import ChargeForm from './ChargeForm'
import OrderList from './OrderList'
import ReportPage from './ReportPage'
import UploadTestPage from './UploadTestPage'

export default function AdminApp() {
  const session = useSession()

  // 一打開就問伺服器目前有沒有登入
  useEffect(() => {
    void checkSession()
  }, [])

  // 切回這個分頁時重新對時：可能在別的分頁登出或延長過，或電腦休眠過
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void checkSession()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />

      {session.status === 'checking' && <p className="loading" style={{ padding: 24 }}>載入中...</p>}

      {session.status === 'signedOut' && <Login />}

      {session.status === 'signedIn' && (
        <Routes>
          {/* 沒有 path 的 Route 只負責套版面，跟前台的 PublicLayout 是同樣的做法 */}
          <Route element={<AdminLayout displayName={session.displayName} expiresAt={session.expiresAt} />}>
            <Route index element={<MemberList />} />
            <Route path="members/new" element={<MemberForm />} />
            <Route path="members/:id/edit" element={<MemberForm />} />
            <Route path="charge" element={<ChargeForm />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="reports" element={<ReportPage />} />
            <Route path="upload-test" element={<UploadTestPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </>
  )
}