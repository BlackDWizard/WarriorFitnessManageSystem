import { Seo } from '../components/Seo'
import { useCoaches } from '../hooks/useCoaches'
import pageStyles from './Page.module.css'
import styles from './CoachesPage.module.css'

export default function CoachesPage() {
  const state = useCoaches()

  return (
    <section className={pageStyles.page}>
      <Seo title="教練師資" />
      <h1 className={pageStyles.title}>教練師資</h1>

      {state.status === 'loading' && <p className={pageStyles.note}>載入中...</p>}
      {state.status === 'error' && <p className={pageStyles.note}>暫時無法載入教練資料，請稍後再試。</p>}
      {state.status === 'ready' && state.coaches.length === 0 && (
        <p className={pageStyles.note}>教練介紹準備中。</p>
      )}

      {state.status === 'ready' && state.coaches.length > 0 && (
        <ul className={styles.list}>
          {state.coaches.map(coach => (
            <li key={coach.id}>
              <article className={styles.card} aria-labelledby={`coach-${coach.id}`}>
                <div className={styles.photo}>
                  {coach.photoUrl ? (
                    <img src={coach.photoUrl} alt={`${coach.name}的照片`} loading="lazy" />
                  ) : (
                    // 沒有照片時顯示姓氏，不會是一塊空白
                    <span className={styles.initial} aria-hidden="true">{coach.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className={styles.body}>
                  <h2 id={`coach-${coach.id}`} className={styles.name}>{coach.name}</h2>
                  {coach.title && <p className={styles.title}>{coach.title}</p>}
                  {coach.specialties.length > 0 && (
                    <ul className={styles.tags} aria-label="專長">
                      {coach.specialties.map(s => <li key={s} className={styles.tag}>{s}</li>)}
                    </ul>
                  )}
                  {/* white-space: pre-line 保留教練輸入的換行；React 會自動跳脫文字，不用擔心 XSS */}
                  {coach.bio && <p className={styles.bio}>{coach.bio}</p>}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}