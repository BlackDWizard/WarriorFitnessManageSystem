import { Link } from 'react-router';
import { Seo } from '../components/Seo';
import styles from './HomePage.module.css';

// 文案都是暫定的，請換成健身房自己的話
export default function HomePage() {
  return (
    <>
      <Seo />

      {/* Day 3 換成活動圖片輪播。比例固定 16:9，請健身房用 1920×1080 製作活動圖 */}
      <section className={styles.banner} aria-label="最新活動">
        <p className={styles.bannerPlaceholder}>活動圖片輪播</p>
      </section>

      <section className={styles.intro}>
        <div className={styles.introInner}>
          <h1 className={styles.headline}>從第一次握槓開始</h1>
          <p className={styles.lead}>教練陪你把動作練對，再把重量練上去。</p>
          <div className={styles.actions}>
            <Link to="/form" className={styles.primaryAction}>
              預約體驗課
            </Link>
            <Link to="/pricing" className={styles.secondaryAction}>
              看課程費用
            </Link>
          </div>
        </div>
      </section>

      {/* Day 5 換成學員回饋截圖（Google 評論、IG 留言） */}
      <section className={styles.testimonials} aria-labelledby="testimonials-heading">
        <div className={styles.sectionInner}>
          <h2 id="testimonials-heading" className={styles.sectionTitle}>
            學員怎麼說
          </h2>
          <ul className={styles.shotRow}>
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className={styles.shot}>
                評論截圖 {n}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
