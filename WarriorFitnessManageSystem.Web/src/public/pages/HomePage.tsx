import { Link } from 'react-router';
import { Seo } from '../components/Seo';
import Carousel from '../components/Carousel';
import ImageStrip from '../components/ImageStrip';
import { useSiteImages } from '../hooks/useSiteImages';
import buttons from '../styles/buttons.module.css';
import { siteContent } from '../siteContent';
import styles from './HomePage.module.css';

export default function HomePage() {
  const banners = useSiteImages('Banner');
  const testimonials = useSiteImages('Testimonial');
  const gallery = useSiteImages('Gallery');


  return (
    <>
      <Seo />

      {/* 活動輪播：深色橫條撐滿寬度，正方形的圖放在中間（桌機最寬 640px，手機撐滿） */}
      {banners.status === 'loading' && (
        <div className={styles.bannerBand} aria-hidden="true">
          <div className={`${styles.bannerFrame} ${styles.bannerSkeleton}`} />
        </div>
      )}
      {banners.status === 'ready' && banners.images.length > 0 && (
        <div className={styles.bannerBand}>
          <div className={styles.bannerFrame}>
            <Carousel images={banners.images} label="最新活動" aspectRatio="1 / 1" />
          </div>
        </div>
      )}

      <section className={styles.intro}>
        <div className={styles.introInner}>
          <h1 className={styles.headline}>{siteContent.slogan}</h1>
          <p className={styles.lead}>{siteContent.tagline}</p>
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