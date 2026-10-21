import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch, clearToken } from './api'
import type { Member, MemberStatus } from './types'
import ExpiringMembers from './ExpiringMembers'

const statusLabel: Record<MemberStatus, string> = {
  Active: '有效',
  Expired: '已到期',
  Suspended: '停權',
}

export default function MemberList({ onLogout }: { onLogout: () => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<Member[]>('/api/members')
      .then(setMembers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleStatus(member: Member) {
    const suspending = member.memberStatus !== 'Suspended'
    if (suspending && !confirm(`確定要停權「${member.memberName}」嗎？`)) return

    try {
      const updated = await apiFetch<Member>(
        `/api/members/${member.memberID}/${suspending ? 'suspend' : 'activate'}`,
        { method: 'POST' },
      )
      setMembers(prev => prev.map(m => (m.memberID === updated.memberID ? updated : m)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function handleLogout() {
    clearToken()
    onLogout()
  }

  if (loading) return <p>載入中...</p>

  return (
    <div>
      <h2>會員列表</h2>
      <ExpiringMembers />
      <Link to="/members/new">新增會員</Link>
      <Link to="/charge">現場收款</Link>
      <Link to="/orders">訂單紀錄</Link>
      <Link to="/reports">報表</Link>
      <button onClick={handleLogout}>登出</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table>
        <thead>
          <tr><th>姓名</th><th>電話</th><th>方案</th><th>到期日</th><th>狀態</th><th>操作</th></tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m.memberID}>
              <td>{m.memberName}</td>
              <td>{m.memberPhoneNo ?? '-'}</td>
              <td>{m.memberType ?? '-'}</td>
              <td>{m.memberValidUntil ?? '-'}</td>
              <td>{statusLabel[m.memberStatus]}</td>
              <td>
                <Link to={`/members/${m.memberID}/edit`}>編輯</Link>
                <Link to={`/charge?memberId=${m.memberID}&name=${encodeURIComponent(m.memberName)}`}>收款</Link>
                <button onClick={() => toggleStatus(m)}>
                  {m.memberStatus === 'Suspended' ? '恢復' : '停權'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length === 0 && <p>目前沒有會員資料</p>}
    </div>
  )
}