import { useState } from 'react'
import { Link } from 'react-router'
import { Seo } from '../components/Seo'
import Lightbox from '../components/Lightbox'
import { useSiteImages } from '../hooks/useSiteImages'
import pageStyles from './Page.module.css'
import buttons from '../styles/buttons.module.css'
import styles from './PricingPage.module.css'

export default function PricingPage() {
  const pricing = useSiteImages('Pricing')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className={pageStyles.page}>
      <Seo title="課程費用" />
      <h1 className={pageStyles.title}>課程費用</h1>

      {pricing.status === 'loading' && <p className={pageStyles.note}>載入中...</p>}
      {pricing.status === 'error' && <p className={pageStyles.note}>暫時無法載入價目表，請稍後再試。</p>}
      {pricing.status === 'ready' && pricing.images.length === 0 && (
        <p className={pageStyles.note}>價目表準備中，歡迎直接聯絡我們詢問。</p>
      )}

      {pricing.status === 'ready' && pricing.images.length > 0 && (
        <>
          <p className={styles.hint}>點圖片可以放大檢視</p>
          <ul className={styles.list}>
            {pricing.images.map((image, i) => (
              <li key={image.id}>
                {/* 用 button 包住圖片：鍵盤也能操作，螢幕報讀器會知道這是可以按的 */}
                <button
                  type="button"
                  className={styles.imageButton}
                  aria-label={`放大檢視：${image.altText || `第 ${i + 1} 張價目表`}`}
                  onClick={() => setOpenIndex(i)}
                >
                  <img src={image.url} alt="" className={styles.image} loading={i === 0 ? 'eager' : 'lazy'} />
                </button>
              </li>
            ))}
          </ul>
          <Lightbox images={pricing.images} index={openIndex} onChange={setOpenIndex} />
        </>
      )}

      <div className={styles.cta}>
        <p className={styles.ctaText}>不確定哪個方案適合？先來上一堂體驗課。</p>
        <div className={styles.ctaActions}>
          <Link to="/form" className={buttons.primary}>預約體驗課</Link>
          <Link to="/contact" className={buttons.secondary}>聯絡我們</Link>
        </div>
      </div>
    </section>
  )
}