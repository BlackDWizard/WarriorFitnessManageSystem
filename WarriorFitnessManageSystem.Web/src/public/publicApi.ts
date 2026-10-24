// 前台專用的 API 呼叫：不帶 cookie、不碰後台的登入狀態
// 跟後台的 apiFetch 分開，前台打包時也不會把登入相關的程式一起帶進來
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export type PublicSiteImageCategory = 'Banner' | 'Pricing' | 'Testimonial' | 'Gallery'

export type PublicSiteImage = {
  id: string
  url: string
  altText: string
  linkUrl: string | null
}

async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export function fetchPublicSiteImages(category: PublicSiteImageCategory) {
  return publicFetch<PublicSiteImage[]>(`/api/public/site-images?category=${category}`)
}

export type PublicCoach = {
  id: string
  name: string
  title: string
  specialties: string[]
  bio: string
  photoUrl: string | null
}

export function fetchPublicCoaches() {
  return publicFetch<PublicCoach[]>('/api/public/coaches')
}

export type BookingInput = {
  source: string
  course: string
  goal: string
  goalOther: string // 訓練目標選「其他」時的說明
  healthNotes: string
  name: string
  gender: string
  birthday: string // yyyy-MM-dd
  phone: string
  email: string
  lineId: string
  contactMethod: string
  preferredTime: string
  hadCoachBefore: boolean | null
  preferredCoach: string
  helpNotes: string
  consent: boolean
  website: string // 防機器人的隱藏欄位，真人送出時一定是空字串
}

// 送出預約表單。錯誤訊息會轉成給客人看的中文
export async function submitBooking(input: BookingInput) {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new Error('網路連線有問題，請稍後再試')
  }

  if (res.status === 429) throw new Error('送出次數太多了，請過幾分鐘再試，或直接用 LINE 聯絡我們')
  if (!res.ok) {
    // 後端驗證失敗時會回傳一段中文說明（JSON 字串）
    const text = await res.text()
    let message = '送出失敗，請稍後再試'
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed === 'string') message = parsed
    } catch {
      // 不是 JSON 就用預設訊息
    }
    throw new Error(message)
  }
}
