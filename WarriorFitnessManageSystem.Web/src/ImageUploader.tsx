import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { compressImage } from './imageCompression'
import { uploadImage } from './uploads'
import type { UploadedImage } from './types'
import styles from './ImageUploader.module.css'

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; message: string }
  | { kind: 'done'; originalSize: number; uploadedSize: number }
  | { kind: 'error'; message: string }

type Props = {
  onUploaded: (image: UploadedImage) => void
  buttonLabel?: string
  // 預覽框的比例，例如活動輪播用 '16 / 9'、教練照片用 '3 / 4'
  aspectRatio?: string
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export default function ImageUploader({ onUploaded, buttonLabel = '選擇圖片', aspectRatio = '16 / 9' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  // 預覽用的暫時網址（blob:...）用完要釋放，不然會一直佔著記憶體
  // preview 換成新的、或元件卸載時，cleanup 會釋放舊的那一個
  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // 清空選取，同一個檔案再選一次也會觸發 onChange
    e.target.value = ''
    if (!file) return

    setStatus({ kind: 'working', message: '處理圖片中...' })
    try {
      const blob = await compressImage(file)
      setPreview(URL.createObjectURL(blob))

      setStatus({ kind: 'working', message: '上傳中...' })
      const uploaded = await uploadImage(blob)

      setStatus({ kind: 'done', originalSize: file.size, uploadedSize: blob.size })
      onUploaded(uploaded)
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message })
    }
  }

  const working = status.kind === 'working'

  return (
    <div className={styles.uploader}>
      {/* object-fit: contain 讓整張圖都看得到，比例不對時會看到上下或左右留白 */}
      <div className={styles.preview} style={{ aspectRatio }}>
        {preview
          ? <img src={preview} alt="上傳圖片預覽" className={styles.image} />
          : <span className={styles.placeholder}>尚未選擇圖片</span>}
      </div>

      <div className={styles.actions}>
        {/* 真正的檔案選擇框藏起來，用一般按鈕觸發它，樣式才能統一 */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={handleChange}
        />
        <button type="button" className="btn" disabled={working} onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </button>

        {/* role="status"：狀態文字改變時，螢幕報讀器會唸出來 */}
        <span role="status" className={status.kind === 'error' ? `${styles.status} ${styles.statusError}` : styles.status}>
          {status.kind === 'working' && status.message}
          {status.kind === 'error' && status.message}
          {status.kind === 'done' &&
            `已上傳（原始 ${formatSize(status.originalSize)} → 壓縮後 ${formatSize(status.uploadedSize)}）`}
        </span>
      </div>
    </div>
  )
}