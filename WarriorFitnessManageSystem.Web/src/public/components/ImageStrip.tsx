import { useState } from 'react'
import type { PublicSiteImage } from '../publicApi'
import Lightbox from './Lightbox'
import styles from './ImageStrip.module.css'

type Props = {
  images: PublicSiteImage[]
  // strip：橫向一排可以左右滑（學員回饋）；grid：多欄格狀（環境照片）
  layout: 'strip' | 'grid'
  aspectRatio: string
  // contain：截圖要看到完整內容；cover：照片填滿格子比較好看
  fit: 'contain' | 'cover'
}

// 首頁「學員回饋」和「環境照片」共用：一組可以點開放大的圖片
export default function ImageStrip({ images, layout, aspectRatio, fit }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <>
      <ul className={layout === 'strip' ? styles.strip : styles.grid}>
        {images.map((image, i) => (
          <li key={image.id} className={styles.item}>
            <button
              type="button"
              className={styles.button}
              style={{ aspectRatio }}
              aria-label={`放大檢視：${image.altText || `第 ${i + 1} 張`}`}
              onClick={() => setOpenIndex(i)}
            >
              <img
                src={image.url}
                alt=""
                loading="lazy"
                className={fit === 'contain' ? `${styles.image} ${styles.contain}` : styles.image}
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={images} index={openIndex} onChange={setOpenIndex} />
    </>
  )
}