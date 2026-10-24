import { Seo } from '../components/Seo'
import LineButton from '../components/LineButton'
import SocialIcons from '../components/SocialIcons'
import { socialLinks } from '../siteConfig'
import { siteContent } from '../siteContent'
import pageStyles from './Page.module.css'
import styles from './ContactPage.module.css'

export default function ContactPage() {
  const { address, phone, hours } = siteContent.contact
  // tel: 連結只能有數字和 +，把顯示用的 - 和空白拿掉；手機上點一下就能撥號
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`
  // 不需要 API 金鑰的 Google 地圖連結和嵌入網址
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

  return (
    <section className={pageStyles.page}>
      <Seo title="聯絡我們" />
      <h1 className={pageStyles.title}>聯絡我們</h1>

      <div className={styles.layout}>
        <div className={styles.info}>
          {/* 沒有設定的項目整塊不顯示 */}
          {address && (
            <div className={styles.block}>
              <h2 className={styles.label}>地址</h2>
              <p className={styles.value}>{address}</p>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                在 Google 地圖開啟
              </a>
            </div>
          )}

          {phone && (
            <div className={styles.block}>
              <h2 className={styles.label}>電話</h2>
              <a href={phoneHref} className={styles.value}>{phone}</a>
            </div>
          )}

          {hours.length > 0 && (
            <div className={styles.block}>
              <h2 className={styles.label}>營業時間</h2>
              <dl className={styles.hours}>
                {hours.map(row => (
                  <div key={row.days} className={styles.hoursRow}>
                    <dt>{row.days}</dt>
                    <dd>{row.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {(siteContent.social.line || socialLinks.length > 0) && (
            <div className={styles.block}>
              <h2 className={styles.label}>線上聯絡</h2>
              <LineButton />
              {socialLinks.length > 0 && (
                <SocialIcons links={socialLinks} className={styles.social} linkClassName={styles.socialLink} />
              )}
            </div>
          )}
        </div>

        {address && (
          <iframe
            src={mapEmbedUrl}
            title={`${siteContent.brandName} 的位置地圖`}
            className={styles.map}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </section>
  )
}