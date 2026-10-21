import type { OrderStatus, OrderType } from './types'

export const orderTypeLabel: Record<OrderType, string> = {
  MembershipRenew: '會員續約',
  Walkin: '現場單次',
  Other: '其他',
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  Pending: '待付款',
  Paid: '已付款',
  Failed: '付款失敗',
  Cancelled: '已取消',
}