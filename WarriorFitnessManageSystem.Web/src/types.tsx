export type MemberStatus = 'Active' | 'Expired' | 'Suspended'
export type OrderStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled'
export type OrderType = 'MembershipRenew' | 'Walkin' | 'Other'

export type Member = {
  memberID: string
  memberName: string
  memberPhoneNo: string | null
  memberEmail: string | null
  memberType: string | null
  memberPaidAmount: number | null
  memberValidUntil: string | null
  memberStatus: MemberStatus
  memberRemark: string | null
}

export type OrderListItem = {
  orderID: string
  memberName: string | null
  customerName: string | null
  orderType: OrderType
  orderDescription: string | null
  orderAmount: number
  orderStatus: OrderStatus
  orderPaidTime: string | null
  orderCreatedTime: string
  paymentUrl: string | null
}

export type OrderTypeSummary = {
  orderType: OrderType
  count: number
  amount: number
  percentage: number
}

export type MonthlyReport = {
  year: number
  month: number
  totalAmount: number
  totalCount: number
  byType: OrderTypeSummary[]
}

export type ExpiringMember = {
  memberID: string
  memberName: string
  memberPhoneNo: string | null
  memberValidUntil: string
  daysLeft: number
}

export type SessionInfo = {
  username: string
  displayName: string
  expiresInSeconds: number
}

export type UploadedImage = {
  path: string
  url: string
}