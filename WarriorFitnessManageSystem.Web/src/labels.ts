import type { MemberStatus, OrderStatus, OrderType } from './types'

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

export const memberStatusLabel: Record<MemberStatus, string> = {
  Active: '有效',
  Expired: '已到期',
  Suspended: '停權',
}

// 狀態標籤的顏色，對應 admin.css 的 .badge-success 等 class
export type BadgeTone = 'success' | 'warning' | 'danger' | 'muted'

export const orderStatusTone: Record<OrderStatus, BadgeTone> = {
  Pending: 'warning',
  Paid: 'success',
  Failed: 'danger',
  Cancelled: 'muted',
}

export const memberStatusTone: Record<MemberStatus, BadgeTone> = {
  Active: 'success',
  Expired: 'warning',
  Suspended: 'danger',
}