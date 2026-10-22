import { Link } from 'react-router';
import { Seo } from '../components/Seo';
import Carousel from '../components/Carousel';
import ImageStrip from '../components/ImageStrip';
import { useSiteImages } from '../hooks/useSiteImages';
import buttons from '../styles/buttons.module.css';
import styles from './HomePage.module.css';

// 文案都是暫定的，請換成健身房自己的話
export default function HomePage() {
  const banners = useSiteImages('Banner');
  const testimonials = useSiteImages('Testimonial');
  const gallery = useSiteImages('Gallery');

  return (
    <>
      <Seo />

      {/* 載入中先放一個同樣比例的灰色區塊佔位，圖片出來時版面不會往下跳 */}
      {banners.status === 'loading' && <div className={styles.bannerSkeleton} aria-hidden="true" />}
      {/* 沒有活動圖或載入失敗時整塊不顯示，直接從介紹區開始 */}
      {banners.status === 'ready' && <Carousel images={banners.images} label="最新活動" />}

      <section className={styles.intro}>
        <div className={styles.introInner}>
          <h1 className={styles.headline}>從第一次握槓開始</h1>
          <p className={styles.lead}>教練陪你把動作練對，再把重量練上去。</p>
          <div className={styles.actions}>
            <Link to="/form" className={buttons.primary}>
              預約體驗課
            </Link>
            <Link to="/pricing" className={buttons.secondary}>
              看課程費用
            </Link>
          </div>
        </div>
      </section>

      {/* 學員回饋和環境照片：有圖片才顯示整個區塊，教練還沒上傳時首頁不會出現空的標題 */}
      {testimonials.status === 'ready' && testimonials.images.length > 0 && (
        <section className={styles.testimonials} aria-labelledby="testimonials-heading">
          <div className={styles.sectionInner}>
            <h2 id="testimonials-heading" className={styles.sectionTitle}>
              學員怎麼說
            </h2>
            <ImageStrip images={testimonials.images} layout="strip" aspectRatio="3 / 4" fit="contain" />
          </div>
        </section>
      )}

      {gallery.status === 'ready' && gallery.images.length > 0 && (
        <section aria-labelledby="gallery-heading">
          <div className={styles.sectionInner}>
            <h2 id="gallery-heading" className={styles.sectionTitle}>
              環境一覽
            </h2>
            <ImageStrip images={gallery.images} layout="grid" aspectRatio="4 / 3" fit="cover" />
          </div>
        </section>
      )}
    </>
  );
}