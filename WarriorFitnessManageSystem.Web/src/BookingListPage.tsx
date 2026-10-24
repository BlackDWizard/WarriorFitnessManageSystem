import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchBookings, type BookingStatusFilter } from './bookings'
import type { BookingListItem } from './types'

// 只顯示到分鐘
function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const filters: { value: BookingStatusFilter; label: string }[] = [
  { value: 'pending', label: '未聯絡' },
  { value: 'handled', label: '已聯絡' },
  { value: 'all', label: '全部' },
]

export default function BookingListPage() {
  const [status, setStatus] = useState<BookingStatusFilter>('pending')
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    fetchBookings(status)
      .then(data => { if (!ignore) setBookings(data) })
      .catch(err => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [status])

  function changeStatus(next: BookingStatusFilter) {
    setStatus(next)
    setLoading(true)
    setError('')
  }

  return (
    <>
      <div className="page-header">
        <h2>體驗預約</h2>
      </div>

      {/* 預設只看「未聯絡」：教練打開這頁，看到的就是還要處理的 */}
      <div className="toolbar">
        <div className="btn-group" role="group" aria-label="篩選">
          {filters.map(f => (
            <button
              key={f.value}
              type="button"
              className={status === f.value ? 'btn btn-sm btn-primary' : 'btn btn-sm'}
              aria-pressed={status === f.value}
              onClick={() => changeStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {loading ? (
        <p className="loading">載入中...</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>填寫時間</th><th>姓名</th><th>課程</th><th>手機</th><th>聯繫方式</th><th>方便時段</th><th>狀態</th><th></th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{formatTime(b.createdTime)}</td>
                  <td>{b.name}</td>
                  <td>{b.course}</td>
                  <td>{b.phone}</td>
                  <td>{b.contactMethod}</td>
                  <td className="wrap">{b.preferredTime}</td>
                  <td>
                    <span className={b.isHandled ? 'badge badge-muted' : 'badge badge-warning'}>
                      {b.isHandled ? '已聯絡' : '未聯絡'}
                    </span>
                  </td>
                  <td><Link to={`/bookings/${b.id}`} className="btn btn-sm">查看</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="empty">{status === 'pending' ? '沒有待聯絡的預約，都處理完了' : '沒有符合條件的預約'}</p>
          )}
        </div>
      )}
    </>
  )
}
