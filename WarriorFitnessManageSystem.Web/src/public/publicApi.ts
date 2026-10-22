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