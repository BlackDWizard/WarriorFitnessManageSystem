import { useEffect, useState } from 'react'
import { fetchPublicSiteImages, type PublicSiteImage, type PublicSiteImageCategory } from '../publicApi'

export type SiteImagesState =
  | { status: 'loading' }
  | { status: 'ready'; images: PublicSiteImage[] }
  | { status: 'error' }

// 自訂 hook：把「抓資料 + 載入中 + 錯誤」包起來，每個前台頁面一行就能用
export function useSiteImages(category: PublicSiteImageCategory): SiteImagesState {
  const [state, setState] = useState<SiteImagesState>({ status: 'loading' })

  useEffect(() => {
    let ignore = false
    fetchPublicSiteImages(category)
      .then(images => { if (!ignore) setState({ status: 'ready', images }) })
      .catch(err => {
        console.error('載入網站圖片失敗', err)
        if (!ignore) setState({ status: 'error' })
      })
    return () => { ignore = true }
  }, [category])

  return state
}