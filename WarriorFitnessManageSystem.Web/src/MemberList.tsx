import { useEffect, useState } from 'react'
import { apiFetch, clearToken } from './api'

type Member = {
    memberID: string
    memberName: string
    memberPhoneNo: string | null
    memberValidUntil: string | null
    memberStatus: 'Active' | 'Expired' | 'Suspended'
}

const statusLabel: Record<Member['memberStatus'], string> = {
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

    function handleLogout() {
        clearToken()
        onLogout()
    }

    if (loading) return <p>載入中...</p>
    if (error) return <p style={{ color: 'red' }}>{error}</p>

    return (
        <div>
            <h2>會員列表</h2>
            <button onClick={handleLogout}>登出</button>
            <table>
                <thead>
                    <tr><th>姓名</th><th>電話</th><th>到期日</th><th>狀態</th></tr>
                </thead>
                <tbody>
                    {members.map(m => (
                        <tr key={m.memberID}>
                            <td>{m.memberName}</td>
                            <td>{m.memberPhoneNo ?? '-'}</td>
                            <td>{m.memberValidUntil ?? '-'}</td>
                            <td>{statusLabel[m.memberStatus]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {members.length === 0 && <p>目前沒有會員資料</p>}
        </div>
    )
}