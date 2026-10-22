import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import type { PublicSiteImage } from '../publicApi'
import ImageLink from './ImageLink'
import styles from './Carousel.module.css'

const AUTOPLAY_MS = 5000
const SWIPE_THRESHOLD_PX = 50

// 使用者在系統設定開了「減少動態效果」，就不要自動輪播
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Props = {
  images: PublicSiteImage[]
  label: string
  aspectRatio?: string
}

export default function Carousel({ images, label, aspectRatio = '16 / 9' }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const pointerStartX = useRef<number | null>(null)
  const swiped = useRef(false)
  const count = images.length

  // 取餘數讓「最後一張的下一張」回到第一張、「第一張的上一張」到最後一張
  const goTo = (next: number) => setIndex((next + count) % count)

  // 每次換到新的一張就重新計時 5 秒；手動切換後也會從頭計時，不會剛切過去就馬上跳走
  useEffect(() => {
    if (paused || prefersReducedMotion || count < 2) return
    const id = setTimeout(() => setIndex(i => (i + 1) % count), AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [index, paused, count])

  // 手機左右滑動：記下按下的位置，放開時比較移動距離
  function handlePointerDown(e: PointerEvent) {
    pointerStartX.current = e.clientX
    swiped.current = false
  }

  function handlePointerUp(e: PointerEvent) {
    if (pointerStartX.current === null) return
    const deltaX = e.clientX - pointerStartX.current
    pointerStartX.current = null
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
      swiped.current = true
      goTo(index + (deltaX < 0 ? 1 : -1))
    }
  }

  // 滑動的手指放開時會順便觸發點擊；剛滑過就取消這次點擊，不要誤開連結
  function handleClickCapture(e: MouseEvent) {
    if (swiped.current) {
      e.preventDefault()
      e.stopPropagation()
      swiped.current = false
    }
  }

  if (count === 0) return null

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label={label}
      // 滑鼠移上去、或用鍵盤操作時暫停，讓人有時間看清楚
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={styles.viewport}
        style={{ aspectRatio }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerStartX.current = null }}
        onClickCapture={handleClickCapture}
      >
        {/* 所有圖片排成一橫列，用 translateX 移動整列，一次只露出一張 */}
        <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((image, i) => (
            <div
              key={image.id}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={i !== index}
            >
              {/* 看不到的那幾張，連結不能被 Tab 選到 */}
              <ImageLink href={image.linkUrl} className={styles.slideLink} tabIndex={i === index ? 0 : -1}>
                <img
                  src={image.url}
                  alt={image.altText}
                  className={styles.image}
                  draggable={false}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                />
              </ImageLink>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="上一張" onClick={() => goTo(index - 1)}>
            <FaChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="下一張" onClick={() => goTo(index + 1)}>
            <FaChevronRight aria-hidden="true" />
          </button>

          <div className={styles.dots}>
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                className={i === index ? `${styles.dot} ${styles.dotActive}` : styles.dot}
                aria-label={`第 ${i + 1} 張`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}