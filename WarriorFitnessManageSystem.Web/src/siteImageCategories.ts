import type { SiteImageCategory } from './types'

// 四種網站圖片共用同一個管理頁，差別只在這裡的設定
export type SiteImageCategoryConfig = {
  category: SiteImageCategory
  slug: string // 網址用的名稱：/content/banners
  title: string
  description: string
  aspectRatio: string // 預覽框比例
  supportsLink: boolean // 前台點圖片能不能連到別的頁面
}

export const siteImageCategories: SiteImageCategoryConfig[] = [
  {
    category: 'Banner',
    slug: 'banners',
    title: '活動輪播',
    description: '首頁的活動輪播，也會列在「最新活動」頁。請用正方形（1:1）的圖片，跟 IG 貼文一樣，例如 1080×1080。',
    aspectRatio: '1 / 1',
    supportsLink: true,
  },
  {
    category: 'Pricing',
    slug: 'pricing',
    title: '課程費用',
    description: '「課程費用」頁的價目圖，可以放多張，依順序由上往下顯示。',
    aspectRatio: '3 / 4',
    supportsLink: false,
  },
  {
    category: 'Testimonial',
    slug: 'testimonials',
    title: '學員回饋',
    description: 'Google 評論或 IG 留言的截圖，會顯示在首頁的「學員怎麼說」。',
    aspectRatio: '3 / 4',
    supportsLink: false,
  },
  {
    category: 'Gallery',
    slug: 'gallery',
    title: '環境照片',
    description: '健身房的環境照片。',
    aspectRatio: '4 / 3',
    supportsLink: false,
  },
]

export function findCategoryBySlug(slug: string | undefined) {
  return siteImageCategories.find(c => c.slug === slug)
}