import { apiFetch } from './api'
import type { UploadedImage } from './types'

export function uploadImage(blob: Blob) {
  const form = new FormData()
  // 欄位名稱 file 要和後端 endpoint 的參數名稱一致；檔名只是參考，後端會用 GUID 重新命名
  form.append('file', blob, blob.type === 'image/webp' ? 'upload.webp' : 'upload.jpg')
  return apiFetch<UploadedImage>('/api/uploads', { method: 'POST', body: form })
}