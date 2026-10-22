import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from './api'
import { memberStatusLabel, memberStatusTone } from './labels'
import type { Member } from './types'
import ExpiringMembers from './ExpiringMembers'

export default function MemberList() {
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

  return (
    <>
      <div className="page-header">
        <h2>會員列表</h2>
        <Link to="/members/new" className="btn btn-primary">新增會員</Link>
      </div>

      <ExpiringMembers />

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {loading ? (
        <p className="loading">載入中...</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
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
                  <td>
                    <span className={`badge badge-${memberStatusTone[m.memberStatus]}`}>
                      {memberStatusLabel[m.memberStatus]}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <Link to={`/members/${m.memberID}/edit`} className="btn btn-sm">編輯</Link>
                      <Link
                        to={`/charge?memberId=${m.memberID}&name=${encodeURIComponent(m.memberName)}`}
                        className="btn btn-sm"
                      >
                        收款
                      </Link>
                      <button
                        type="button"
                        className={m.memberStatus === 'Suspended' ? 'btn btn-sm' : 'btn btn-sm btn-danger'}
                        onClick={() => toggleStatus(m)}
                      >
                        {m.memberStatus === 'Suspended' ? '恢復' : '停權'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <p className="empty">目前沒有會員資料，按右上角「新增會員」開始建立。</p>}
        </div>
      )}
    </>
  )
}