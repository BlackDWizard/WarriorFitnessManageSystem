export type MemberStatus = 'Active' | 'Expired' | 'Suspended'

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