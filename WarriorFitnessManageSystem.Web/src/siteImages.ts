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