import { Seo } from '../components/Seo'
import LineButton from '../components/LineButton'
import { siteContent } from '../siteContent'
import pageStyles from './Page.module.css'
import styles from './FaqPage.module.css'

export default function FaqPage() {
  return (
    <section className={pageStyles.page}>
      <Seo title="常見問題" />
      <h1 className={pageStyles.title}>常見問題</h1>

      {/* <details> + <summary> 是瀏覽器原生的「點一下展開」，不用寫任何 JavaScript，
          鍵盤和螢幕報讀器也都支援 */}
      <div className={styles.list}>
        {siteContent.faq.map(item => (
          <details key={item.question} className={styles.item}>
            <summary className={styles.question}>{item.question}</summary>
            <p className={styles.answer}>{item.answer}</p>
          </details>
        ))}
      </div>

      <div className={styles.more}>
        <p className={styles.moreText}>還有其他問題嗎？直接問我們吧。</p>
        <LineButton />
      </div>
    </section>
  )
}