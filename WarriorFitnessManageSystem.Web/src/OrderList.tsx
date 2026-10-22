import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { apiFetch } from './api'
import { orderStatusLabel, orderStatusTone, orderTypeLabel } from './labels'
import type { OrderListItem, OrderStatus } from './types'

// 只顯示到分鐘，表格比較不會被撐寬
function formatTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString('zh-TW', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'
}

export default function OrderList() {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    // ignore：快速切換條件時，舊的請求可能比新的晚回來，晚回來的舊結果直接丟掉
    let ignore = false
    const query = status ? `?status=${status}` : ''
    apiFetch<OrderListItem[]>(`/api/orders${query}`)
      .then(data => { if (!ignore) setOrders(data) })
      .catch(err => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [status])

  // 「載入中」和「清掉錯誤」在使用者換條件的當下設定，不放進 effect
  function changeStatus(next: OrderStatus | '') {
    setStatus(next)
    setLoading(true)
    setError('')
  }

  async function cancelOrder(order: OrderListItem) {
    if (!confirm(`確定要取消這筆 ${order.orderAmount.toLocaleString()} 元的訂單嗎？`)) return

    try {
      await apiFetch(`/api/orders/${order.orderID}/cancel`, { method: 'POST' })
      setOrders(prev => prev.map(o =>
        o.orderID === order.orderID ? { ...o, orderStatus: 'Cancelled', paymentUrl: null } : o))
      setQrUrl(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>訂單紀錄</h2>
      </div>

      <div className="toolbar">
        <label className="field">
          <span className="field-label">狀態</span>
          <select value={status} onChange={e => changeStatus(e.target.value as OrderStatus | '')}>
            <option value="">全部</option>
            <option value="Pending">待付款</option>
            <option value="Paid">已付款</option>
            <option value="Failed">付款失敗</option>
            <option value="Cancelled">已取消</option>
          </select>
        </label>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {qrUrl && (
        <div className="card qr-panel">
          <div className="qr-box">
            <QRCodeSVG value={qrUrl} size={200} />
          </div>
          <p className="qr-url">
            <a href={qrUrl} target="_blank" rel="noreferrer">{qrUrl}</a>
          </p>
          <button type="button" className="btn" onClick={() => setQrUrl(null)}>關閉</button>
        </div>
      )}

      {loading ? (
        <p className="loading">載入中...</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>建立時間</th><th>付款人</th><th>類型</th><th>說明</th>
                <th className="num">金額</th><th>狀態</th><th>付款時間</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.orderID}>
                  <td>{formatTime(o.orderCreatedTime)}</td>
                  <td>{o.memberName ? `${o.memberName}（會員）` : (o.customerName ?? '-')}</td>
                  <td>{orderTypeLabel[o.orderType]}</td>
                  <td className="wrap">{o.orderDescription ?? '-'}</td>
                  <td className="num">{o.orderAmount.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${orderStatusTone[o.orderStatus]}`}>
                      {orderStatusLabel[o.orderStatus]}
                    </span>
                  </td>
                  <td>{formatTime(o.orderPaidTime)}</td>
                  <td>
                    {o.orderStatus === 'Pending' && o.paymentUrl && (
                      <div className="btn-group">
                        <button type="button" className="btn btn-sm" onClick={() => setQrUrl(o.paymentUrl)}>顯示 QR</button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => cancelOrder(o)}>取消</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="empty">沒有符合條件的訂單</p>}
        </div>
      )}
    </>
  )
}