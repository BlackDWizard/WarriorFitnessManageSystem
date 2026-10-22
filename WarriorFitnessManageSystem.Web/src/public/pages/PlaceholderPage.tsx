import { Seo } from '../components/Seo';
import styles from './Page.module.css';

// 還沒完成的頁面先用這個佔位，完成後換成正式的頁面元件
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className={styles.page}>
      <Seo title={title} />
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.note}>內容準備中。</p>
    </section>
  );
}
