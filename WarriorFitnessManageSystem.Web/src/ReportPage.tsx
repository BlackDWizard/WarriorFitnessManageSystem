import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from './api'
import { orderTypeLabel } from './labels'
import type { MonthlyReport } from './types'

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function ReportPage() {
  const [month, setMonth] = useState(currentMonth)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!month) return
    const [year, m] = month.split('-')
    setError('')
    apiFetch<MonthlyReport>(`/api/reports/monthly?year=${year}&month=${Number(m)}`)
      .then(setReport)
      .catch(err => setError(err.message))
  }, [month])

  return (
    <div>
      <h2>營收報表</h2>
      <Link to="/">回會員列表</Link>

      <div>
        <label>月份 <input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {report && (
        <>
          <p>本月營收：NT$ {report.totalAmount.toLocaleString()}（共 {report.totalCount} 筆）</p>

          {report.byType.length === 0 ? (
            <p>這個月沒有已付款的訂單</p>
          ) : (
            <table>
              <thead>
                <tr><th>類型</th><th>筆數</th><th>金額</th><th>占比</th></tr>
              </thead>
              <tbody>
                {report.byType.map(t => (
                  <tr key={t.orderType}>
                    <td>{orderTypeLabel[t.orderType]}</td>
                    <td>{t.count}</td>
                    <td>{t.amount.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 120, height: 10, background: '#eee' }}>
                          <div style={{ width: `${t.percentage}%`, height: '100%', background: '#4a90d9' }} />
                        </div>
                        {t.percentage}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}