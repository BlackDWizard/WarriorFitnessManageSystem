import { Seo } from '../components/Seo'
import ImageLink from '../components/ImageLink'
import { useSiteImages } from '../hooks/useSiteImages'
import pageStyles from './Page.module.css'
import styles from './EventsPage.module.css'

// 「最新活動」：首頁輪播的同一組圖片，在這裡全部攤開由上往下列出
export default function EventsPage() {
  const banners = useSiteImages('Banner')

  return (
    <section className={pageStyles.page}>
      <Seo title="最新活動" />
      <h1 className={pageStyles.title}>最新活動</h1>

      {banners.status === 'loading' && <p className={pageStyles.note}>載入中...</p>}
      {banners.status === 'error' && <p className={pageStyles.note}>暫時無法載入活動，請稍後再試。</p>}
      {banners.status === 'ready' && banners.images.length === 0 && (
        <p className={pageStyles.note}>目前沒有進行中的活動。</p>
      )}

      {banners.status === 'ready' && banners.images.length > 0 && (
        <ul className={styles.list}>
          {banners.images.map(image => (
            <li key={image.id}>
              <ImageLink href={image.linkUrl} className={styles.link}>
                <img src={image.url} alt={image.altText} className={styles.image} loading="lazy" />
              </ImageLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}