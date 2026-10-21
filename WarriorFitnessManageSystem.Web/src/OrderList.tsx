import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from './api'
import type { OrderListItem, OrderStatus, OrderType } from './types'
import { QRCodeSVG } from 'qrcode.react'

const statusLabel: Record<OrderStatus, string> = {
    Pending: '待付款',
    Paid: '已付款',
    Failed: '付款失敗',
    Cancelled: '已取消',
}

const typeLabel: Record<OrderType, string> = {
    MembershipRenew: '會員續約',
    Walkin: '現場單次',
    Other: '其他',
}

function formatTime(value: string | null) {
    return value ? new Date(value).toLocaleString('zh-TW', { hour12: false }) : '-'
}

export default function OrderList() {
    const [orders, setOrders] = useState<OrderListItem[]>([])
    const [status, setStatus] = useState<OrderStatus | ''>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [qrUrl, setQrUrl] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        setError('')
        const query = status ? `?status=${status}` : ''
        apiFetch<OrderListItem[]>(`/api/orders${query}`)
            .then(setOrders)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [status])

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
        <div>
            <h2>訂單紀錄</h2>
            <Link to="/">回會員列表</Link>

            <div>
                <label>狀態{' '}
                    <select value={status} onChange={e => setStatus(e.target.value as OrderStatus | '')}>
                        <option value="">全部</option>
                        <option value="Pending">待付款</option>
                        <option value="Paid">已付款</option>
                        <option value="Failed">付款失敗</option>
                        <option value="Cancelled">已取消</option>
                    </select>
                </label>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {qrUrl && (
                <div>
                    <QRCodeSVG value={qrUrl} size={200} />
                    <p><a href={qrUrl} target="_blank" rel="noreferrer">{qrUrl}</a></p>
                    <button onClick={() => setQrUrl(null)}>關閉</button>
                </div>
            )}

            {loading ? <p>載入中...</p> : (
                <table>
                    <thead>
                        <tr>
                            <th>建立時間</th><th>付款人</th><th>類型</th><th>說明</th>
                            <th>金額</th><th>狀態</th><th>付款時間</th><th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.orderID}>
                                <td>{formatTime(o.orderCreatedTime)}</td>
                                <td>{o.memberName ? `${o.memberName}（會員）` : (o.customerName ?? '-')}</td>
                                <td>{typeLabel[o.orderType]}</td>
                                <td>{o.orderDescription ?? '-'}</td>
                                <td>{o.orderAmount.toLocaleString()}</td>
                                <td>{statusLabel[o.orderStatus]}</td>
                                <td>{formatTime(o.orderPaidTime)}</td>
                                <td>
                                    {o.orderStatus === 'Pending' && o.paymentUrl && (
                                        <>
                                            <button onClick={() => setQrUrl(o.paymentUrl)}>顯示 QR</button>
                                            <button onClick={() => cancelOrder(o)}>取消</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {!loading && orders.length === 0 && <p>沒有符合條件的訂單</p>}
        </div>
    )
}