import { Link } from 'react-router'
import { Seo } from '../components/Seo'
import ImageStrip from '../components/ImageStrip'
import { useSiteImages } from '../hooks/useSiteImages'
import { siteContent } from '../siteContent'
import buttons from '../styles/buttons.module.css'
import pageStyles from './Page.module.css'
import styles from './AboutPage.module.css'

export default function AboutPage() {
  // 環境照片跟首頁共用同一組，後台上傳一次兩邊都會顯示
  const gallery = useSiteImages('Gallery')
  const { about } = siteContent

  return (
    <section className={pageStyles.page}>
      <Seo title="關於我們" />
      <h1 className={pageStyles.title}>關於我們</h1>

      <p className={styles.slogan}>{siteContent.slogan}</p>
      <div className={styles.text}>
        {about.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </div>

      <ul className={styles.features}>
        {about.features.map(feature => (
          <li key={feature.title} className={styles.feature}>
            <h2 className={styles.featureTitle}>{feature.title}</h2>
            <p className={styles.featureText}>{feature.text}</p>
          </li>
        ))}
      </ul>

      {gallery.status === 'ready' && gallery.images.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>環境一覽</h2>
          <ImageStrip images={gallery.images} layout="grid" aspectRatio="1 / 1" fit="cover" />
        </>
      )}

      <div className={styles.cta}>
        <Link to="/form" className={buttons.primary}>預約體驗課</Link>
        <Link to="/coaches" className={buttons.secondary}>認識教練</Link>
      </div>
    </section>
  )
}