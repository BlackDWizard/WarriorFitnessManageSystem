import { useEffect, useState } from 'react'
import { apiFetch } from './api'
import type { ExpiringMember } from './types'

export default function ExpiringMembers() {
  const [members, setMembers] = useState<ExpiringMember[]>([])

  useEffect(() => {
    apiFetch<ExpiringMember[]>('/api/reports/expiring-members?days=3')
      .then(setMembers)
      .catch(() => setMembers([]))
  }, [])

  if (members.length === 0) return null

  return (
    <section className="alert alert-warning" aria-labelledby="expiring-heading">
      <strong id="expiring-heading">3 天內到期（{members.length} 位）</strong>
      <ul className="alert-list">
        {members.map(m => (
          <li key={m.memberID}>
            {m.memberName}　{m.memberPhoneNo ?? '無電話'}　{m.memberValidUntil}
            （{m.daysLeft === 0 ? '今天到期' : `剩 ${m.daysLeft} 天`}）
          </li>
        ))}
      </ul>
    </section>
  )
}