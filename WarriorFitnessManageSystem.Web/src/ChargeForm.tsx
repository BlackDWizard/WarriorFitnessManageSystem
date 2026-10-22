import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { apiFetch } from './api'
import { orderStatusTone } from './labels'
import type { OrderStatus, OrderType } from './types'

type OrderType = 'MembershipRenew' | 'Walkin' | 'Other'
type OrderStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled'

type CreateOrderResponse = {
  order: { orderID: string; orderStatus: OrderStatus }
  paymentUrl: string
}

const statusText: Record<OrderStatus, string> = {
  Pending: '等待付款中...',
  Paid: '付款完成',
  Failed: '付款失敗',
  Cancelled: '已取消',
}

export default function ChargeForm() {
  const [params] = useSearchParams()
  const memberId = params.get('memberId')

  const [orderType, setOrderType] = useState<OrderType>(memberId ? 'MembershipRenew' : 'Walkin')
  const [customerName, setCustomerName] = useState(params.get('name') ?? '')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [status, setStatus] = useState<OrderStatus>('Pending')

  useEffect(() => {
    if (!orderId || status !== 'Pending') return

    const timer = setInterval(async () => {
      try {
        const order = await apiFetch<{ orderStatus: OrderStatus }>(`/api/orders/${orderId}`)
        setStatus(order.orderStatus)
      } catch {
        // 單次查詢失敗就等下一輪
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [orderId, status])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amountNumber = Number(amount)
    if (!Number.isInteger(amountNumber) || amountNumber <= 0) {
      setError('金額必須是大於 0 的整數')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await apiFetch<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          memberID: memberId,
          customerName: customerName || null,
          orderType,
          orderDescription: description || null,
          orderAmount: amountNumber,
        }),
      })
      setOrderId(res.order.orderID)
      setPaymentUrl(res.paymentUrl)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (orderId) {
    return (
      <>
        <div className="page-header">
          <h2>請客人掃描付款</h2>
        </div>

        <div className="card qr-panel">
          <div className="qr-box">
            <QRCodeSVG value={paymentUrl} size={240} />
          </div>
          {/* aria-live：狀態從「等待付款」變成「付款完成」時，螢幕報讀器會唸出來 */}
          <p aria-live="polite" style={{ margin: 0 }}>
            狀態：<span className={`badge badge-${orderStatusTone[status]}`}>{statusText[status]}</span>
          </p>
          <p className="qr-url">
            <a href={paymentUrl} target="_blank" rel="noreferrer">{paymentUrl}</a>
          </p>
          <div className="btn-group">
            <button type="button" className="btn" onClick={() => navigator.clipboard.writeText(paymentUrl)}>
              複製連結
            </button>
            <Link to="/" className="btn">回會員列表</Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <h2>{memberId ? '會員收款' : '現場收款'}</h2>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        {error && <p className="alert alert-error" role="alert">{error}</p>}

        <label className="field">
          <span className="field-label">類型</span>
          <select value={orderType} onChange={e => setOrderType(e.target.value as OrderType)}>
            <option value="MembershipRenew">會員續約</option>
            <option value="Walkin">現場單次</option>
            <option value="Other">其他</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">客戶姓名</span>
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">說明</span>
          <input placeholder="例如：月費方案續約" value={description} onChange={e => setDescription(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">金額<span className="required">＊</span></span>
          <input type="number" min="1" step="1" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '建立中...' : '產生收款 QR Code'}
          </button>
          <Link to="/" className="btn">取消</Link>
        </div>
      </form>
    </>
  )

}