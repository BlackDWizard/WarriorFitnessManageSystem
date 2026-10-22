import { useEffect, useState } from 'react'
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
    // ignore：快速切換月份時，晚回來的舊月份結果直接丟掉
    let ignore = false
    const [year, m] = month.split('-')
    apiFetch<MonthlyReport>(`/api/reports/monthly?year=${year}&month=${Number(m)}`)
      .then(data => { if (!ignore) setReport(data) })
      .catch(err => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [month])

  // 清掉錯誤在使用者換月份的當下設定，不放進 effect
  function changeMonth(value: string) {
    setMonth(value)
    setError('')
  }

  return (
    <>
      <div className="page-header">
        <h2>營收報表</h2>
      </div>

      <div className="toolbar">
        <label className="field">
          <span className="field-label">月份</span>
          <input type="month" value={month} onChange={e => changeMonth(e.target.value)} />
        </label>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {report && (
        <>
          <div className="stat-grid">
            <div className="card">
              <p className="stat-label">本月營收</p>
              <p className="stat-value">NT$ {report.totalAmount.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="stat-label">已付款訂單</p>
              <p className="stat-value">{report.totalCount} 筆</p>
            </div>
          </div>

          <div className="table-wrap">
            {report.byType.length === 0 ? (
              <p className="empty">這個月沒有已付款的訂單</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>類型</th><th className="num">筆數</th><th className="num">金額</th><th>占比</th></tr>
                </thead>
                <tbody>
                  {report.byType.map(t => (
                    <tr key={t.orderType}>
                      <td>{orderTypeLabel[t.orderType]}</td>
                      <td className="num">{t.count}</td>
                      <td className="num">{t.amount.toLocaleString()}</td>
                      <td>
                        <span className="bar">
                          <span className="bar-track">
                            <span className="bar-fill" style={{ width: `${t.percentage}%` }} />
                          </span>
                          {t.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  )
}