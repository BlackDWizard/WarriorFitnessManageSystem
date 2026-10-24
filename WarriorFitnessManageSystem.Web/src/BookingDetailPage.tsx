import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { deleteBooking, fetchBooking, setBookingHandled } from './bookings'
import type { BookingDetail } from './types'
import styles from './Booking.module.css'

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', { hour12: false })
}

// 從生日算出目前幾歲：今年生日還沒到就要減一
function ageOf(birthday: string) {
  const [y, m, d] = birthday.split('-').map(Number)
  const now = new Date()
  const hadBirthday = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d)
  return now.getFullYear() - y - (hadBirthday ? 0 : 1)
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchBooking(id)
      .then(setBooking)
      .catch(err => setError(err.message))
  }, [id])

  async function toggleHandled() {
    if (!booking) return
    setSaving(true)
    setError('')
    try {
      setBooking(await setBookingHandled(booking.id, booking.handledTime === null))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!booking || !confirm(`確定要刪除「${booking.name}」的預約嗎？刪除後無法復原。`)) return
    try {
      await deleteBooking(booking.id)
      navigate('/bookings')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!booking) {
    return error ? <p className="alert alert-error" role="alert">{error}</p> : <p className="loading">載入中...</p>
  }

  const handled = booking.handledTime !== null

  // 一行一個欄位：標題 + 內容，用同一份資料產生。順序依教練需要的排列：先看是誰、怎麼聯絡
  const rows: [string, ReactNode][] = [
    ['姓名', booking.name],
    ['性別', booking.gender],
    ['出生年月日', `${booking.birthday}（${ageOf(booking.birthday)} 歲）`],
    // 手機和 Email 做成連結：在手機上點一下就能撥號、寄信
    ['手機號碼', <a key="phone" href={`tel:${booking.phone}`}>{booking.phone}</a>],
    ['Email', <a key="email" href={`mailto:${booking.email}`}>{booking.email}</a>],
    ['LINE ID', booking.lineId],
    ['希望的聯繫方式', booking.contactMethod],
    ['方便聯繫的時間', booking.preferredTime],
    ['想報名的課程', booking.course],
    ['訓練目標', booking.goalOther ? `${booking.goal}：${booking.goalOther}` : booking.goal],
    ['偏好教練', booking.preferredCoach],
    ['是否上過教練課', booking.hadCoachBefore ? '是' : '否'],
    ['手術或受傷狀況', booking.healthNotes],
    ['希望我們如何幫助您', booking.helpNotes || '（未填）'],
    ['如何得知本店', booking.source],
    ['填寫時間', formatTime(booking.createdTime)],
  ]

  return (
    <>
      <div className="page-header">
        <h2>{booking.name} 的預約</h2>
        <span className={handled ? 'badge badge-muted' : 'badge badge-warning'}>
          {handled ? `已聯絡（${formatTime(booking.handledTime!)}）` : '未聯絡'}
        </span>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className="card">
        <dl className={styles.details}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles.row}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={`btn-group ${styles.actions}`}>
        <button type="button" className={handled ? 'btn' : 'btn btn-primary'} disabled={saving} onClick={toggleHandled}>
          {handled ? '改回未聯絡' : '標記為已聯絡'}
        </button>
        <Link to="/bookings" className="btn">回清單</Link>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>刪除</button>
      </div>
    </>
  )
}
