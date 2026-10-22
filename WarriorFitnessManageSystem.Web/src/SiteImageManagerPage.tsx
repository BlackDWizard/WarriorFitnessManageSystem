import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import ImageUploader from './ImageUploader'
import SiteImageCard from './SiteImageCard'
import { findCategoryBySlug, type SiteImageCategoryConfig } from './siteImageCategories'
import { createSiteImage, deleteSiteImage, fetchSiteImages } from './siteImages'
import type { SiteImageItem, UploadedImage } from './types'
import styles from './SiteImageManager.module.css'

export default function SiteImageManagerPage() {
  const { slug } = useParams()
  const config = findCategoryBySlug(slug)
  if (!config) return <Navigate to="/" replace />

  // key：從「活動輪播」切到「課程費用」時，網址變了但元件是同一個，
  // 換一個 key 讓 React 重新建立元件，舊分類的資料和狀態不會殘留
  return <SiteImageManager key={config.category} config={config} />
}

function SiteImageManager({ config }: { config: SiteImageCategoryConfig }) {
  const [images, setImages] = useState<SiteImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // 每次新增成功就換一個 key，上傳元件會重置成空白，方便上傳下一張
  const [uploaderKey, setUploaderKey] = useState(0)

  useEffect(() => {
    let ignore = false
    fetchSiteImages(config.category)
      .then(data => { if (!ignore) setImages(data) })
      .catch(err => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [config.category])

  // 兩段式新增：ImageUploader 已經把檔案傳到 Storage，這裡再建立資料庫的紀錄
  async function handleUploaded(uploaded: UploadedImage) {
    setError('')
    try {
      const created = await createSiteImage(config.category, uploaded.path)
      setImages(prev => [...prev, created])
      setUploaderKey(key => key + 1)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function handleSaved(updated: SiteImageItem) {
    setImages(prev => prev.map(image => (image.id === updated.id ? updated : image)))
  }

  async function handleDelete(image: SiteImageItem) {
    if (!confirm('確定要刪除這張圖片嗎？刪除後無法復原。')) return
    setError('')
    try {
      await deleteSiteImage(image.id)
      setImages(prev => prev.filter(i => i.id !== image.id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>{config.title}</h2>
      </div>
      <p className={styles.description}>{config.description}</p>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <section className="card">
        <h3 className={styles.sectionTitle}>新增圖片</h3>
        <ImageUploader
          key={uploaderKey}
          aspectRatio={config.aspectRatio}
          buttonLabel="選擇圖片上傳"
          onUploaded={handleUploaded}
        />
      </section>

      <h3 className={styles.sectionTitle}>目前的圖片（{images.length}）</h3>
      {loading ? (
        <p className="loading">載入中...</p>
      ) : images.length === 0 ? (
        <p className="card empty">還沒有圖片，從上方上傳第一張。</p>
      ) : (
        <ul className={styles.grid}>
          {images.map(image => (
            <li key={image.id}>
              <SiteImageCard image={image} config={config} onSaved={handleSaved} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}