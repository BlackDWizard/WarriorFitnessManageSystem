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