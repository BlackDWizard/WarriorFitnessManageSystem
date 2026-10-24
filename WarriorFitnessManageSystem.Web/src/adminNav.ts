import { siteImageCategories } from './siteImageCategories'

export type AdminNavItem = {
  to: string
  label: string
  // 這些路徑開頭的頁面也算在這個選單項目底下，例如編輯會員算在「會員列表」
  matchPrefixes?: string[]
}

export type AdminNavGroup = {
  title: string
  items: AdminNavItem[]
}

export const adminNav: AdminNavGroup[] = [
  {
    title: '會員管理',
    items: [
      { to: '/', label: '會員列表', matchPrefixes: ['/members'] },
      { to: '/bookings', label: '體驗預約' },
      { to: '/charge', label: '現場收款' },
      { to: '/orders', label: '訂單紀錄' },
      { to: '/reports', label: '營收報表' },
    ],
  },
  // Day 3 起在這裡加上「網站內容」群組：活動圖片、課程費用、教練師資……
  {
    title: '網站內容',
    // 四種網站圖片的選單直接從分類設定產生，新增分類時選單會自動多一項
    items: [
      ...siteImageCategories.map(c => ({ to: `/content/${c.slug}`, label: c.title })),
      { to: '/coaches', label: '教練師資' },
    ],
  },
]

export function isNavItemActive(item: AdminNavItem, pathname: string) {
  // 首頁 / 要完全相符，否則每個頁面都會被當成在首頁底下
  const selfActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  return selfActive || (item.matchPrefixes?.some(prefix => pathname.startsWith(prefix)) ?? false)
}