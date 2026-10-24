import { FaLine } from 'react-icons/fa6'
import { siteContent } from '../siteContent'
import styles from './LineButton.module.css'

// 「加 LINE 聯絡」按鈕。還沒設定 LINE 連結時不顯示
export default function LineButton({ label = '加 LINE 聯絡我們' }: { label?: string }) {
  if (!siteContent.social.line) return null

  return (
    <a href={siteContent.social.line} target="_blank" rel="noopener noreferrer" className={styles.button}>
      <FaLine aria-hidden="true" size={22} />
      {label}
    </a>
  )
}