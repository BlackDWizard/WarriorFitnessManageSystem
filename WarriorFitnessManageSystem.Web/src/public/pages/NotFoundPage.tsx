import { Link } from 'react-router';
import { Seo } from '../components/Seo';
import styles from './Page.module.css';

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <Seo title="找不到頁面" />
      <h1 className={styles.title}>找不到這個頁面</h1>
      <p className={styles.note}>網址可能打錯了，或這個頁面已經移除。</p>
      <p>
        <Link to="/" className={styles.link}>
          回首頁
        </Link>
      </p>
    </section>
  );
}
