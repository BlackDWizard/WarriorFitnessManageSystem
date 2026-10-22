import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { FaChevronLeft, FaChevronRight, FaXmark } from 'react-icons/fa6'
import type { PublicSiteImage } from '../publicApi'
import styles from './Lightbox.module.css'

type Props = {
  images: PublicSiteImage[]
  // 目前放大的是第幾張；null 代表關閉
  index: number | null
  onChange: (index: number | null) => void
}

// 點圖片放大檢視。用瀏覽器原生的 <dialog>：
// 開啟時背景不能操作、焦點會留在對話框裡、按 Esc 自動關閉，這些都不用自己寫
export default function Lightbox({ images, index, onChange }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const count = images.length

  // 讓 <dialog> 的開關跟 index 同步：這是 effect 的正確用途（跟 React 外部的 DOM API 同步）
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (index !== null && !dialog.open) dialog.showModal()
    if (index === null && dialog.open) dialog.close()
  }, [index])

  const go = (step: number) => {
    if (index === null) return
    onChange((index + step + count) % count)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowRight') go(1)
  }

  // 點到圖片外面的暗色區域就關閉：那時候點到的元素是 <dialog> 本身
  function handleClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onChange(null)
  }

  const image = index !== null ? images[index] : null

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="圖片放大檢視"
      // 按 Esc 時瀏覽器會自己關掉 dialog，這裡把 React 的狀態也同步成關閉
      onClose={() => onChange(null)}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {image && (
        <figure className={styles.figure}>
          <img src={image.url} alt={image.altText} className={styles.image} />
          <figcaption className={styles.caption}>
            {count > 1 && <span className={styles.counter}>{index! + 1} / {count}</span>}
            {image.altText}
          </figcaption>
        </figure>
      )}

      <button type="button" className={`${styles.button} ${styles.close}`} aria-label="關閉" onClick={() => onChange(null)}>
        <FaXmark aria-hidden="true" />
      </button>

      {count > 1 && (
        <>
          <button type="button" className={`${styles.button} ${styles.prev}`} aria-label="上一張" onClick={() => go(-1)}>
            <FaChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className={`${styles.button} ${styles.next}`} aria-label="下一張" onClick={() => go(1)}>
            <FaChevronRight aria-hidden="true" />
          </button>
        </>
      )}
    </dialog>
  )
}