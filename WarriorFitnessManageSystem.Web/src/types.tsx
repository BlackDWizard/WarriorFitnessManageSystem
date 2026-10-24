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

export type SiteImageCategory = 'Banner' | 'Pricing' | 'Testimonial' | 'Gallery'

export type SiteImageItem = {
  id: string
  category: SiteImageCategory
  storagePath: string
  url: string
  altText: string
  linkUrl: string | null
  sortOrder: number
  isVisible: boolean
}

export type CoachItem = {
  id: string
  name: string
  title: string
  specialties: string[]
  bio: string
  photoPath: string | null
  photoUrl: string | null
  sortOrder: number
  isVisible: boolean
}

export type BookingListItem = {
  id: string
  createdTime: string
  name: string
  course: string
  phone: string
  contactMethod: string
  preferredTime: string
  isHandled: boolean
}

export type BookingDetail = {
  id: string
  createdTime: string
  source: string
  course: string
  goal: string
  goalOther: string
  healthNotes: string
  name: string
  gender: string
  birthday: string
  phone: string
  email: string
  lineId: string
  contactMethod: string
  preferredTime: string
  hadCoachBefore: boolean
  preferredCoach: string
  helpNotes: string
  handledTime: string | null
}
