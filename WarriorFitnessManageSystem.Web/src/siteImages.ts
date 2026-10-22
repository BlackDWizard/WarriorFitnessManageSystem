import { apiFetch } from './api'
import type { SiteImageCategory, SiteImageItem } from './types'

export function fetchSiteImages(category: SiteImageCategory) {
  return apiFetch<SiteImageItem[]>(`/api/site-images?category=${category}`)
}

// 只送 Storage 路徑，公開網址由後端自己組
export function createSiteImage(category: SiteImageCategory, storagePath: string) {
  return apiFetch<SiteImageItem>('/api/site-images', {
    method: 'POST',
    body: JSON.stringify({ category, storagePath, altText: '', linkUrl: null }),
  })
}

export type SiteImageChanges = {
  altText: string
  linkUrl: string | null
  isVisible: boolean
}

export function updateSiteImage(id: string, changes: SiteImageChanges) {
  return apiFetch<SiteImageItem>(`/api/site-images/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

export function deleteSiteImage(id: string) {
  return apiFetch<void>(`/api/site-images/${id}`, { method: 'DELETE' })
}

// 送出排好順序的完整 id 清單，後端依位置重新編號
export function reorderSiteImages(category: SiteImageCategory, ids: string[]) {
  return apiFetch<void>('/api/site-images/reorder', {
    method: 'PUT',
    body: JSON.stringify({ category, ids }),
  })
}