import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import ImageUploader from './ImageUploader'
import SortableSiteImageCard from './SortableSiteImageCard'
import { findCategoryBySlug, type SiteImageCategoryConfig } from './siteImageCategories'
import { createSiteImage, deleteSiteImage, fetchSiteImages, reorderSiteImages } from './siteImages'
import type { SiteImageItem, UploadedImage } from './types'
import styles from './SiteImageManager.module.css'

// 螢幕報讀器的語音提示，dnd-kit 預設是英文，這裡換成中文
function positionOf(images: SiteImageItem[], id: string | number) {
  return images.findIndex(image => image.id === id) + 1
}

function createAnnouncements(images: SiteImageItem[]): Announcements {
  return {
    onDragStart: ({ active }) => `拿起第 ${positionOf(images, active.id)} 張圖片`,
    onDragOver: ({ over }) => (over ? `移到第 ${positionOf(images, over.id)} 個位置` : '目前不在排序範圍內'),
    onDragEnd: ({ over }) => (over ? `放在第 ${positionOf(images, over.id)} 個位置` : '已放下，順序沒有改變'),
    onDragCancel: () => '已取消拖曳，順序沒有改變',
  }
}

const screenReaderInstructions = {
  draggable: '按空白鍵拿起圖片，用方向鍵移動位置，再按一次空白鍵放下，按 Esc 取消。',
}

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

  const [orderStatus, setOrderStatus] = useState('')

  // 感應器：決定「怎樣算開始拖曳」
  // PointerSensor 同時支援滑鼠和觸控，移動超過 5px 才開始，單純點一下把手不會被當成拖曳
  // KeyboardSensor 讓不能用滑鼠的人也能用鍵盤排序
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

  // 放開時：畫面先換成新順序，再送到後端；失敗就換回原本的順序
  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return

    const previous = images
    const oldIndex = images.findIndex(image => image.id === active.id)
    const newIndex = images.findIndex(image => image.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)

    setImages(reordered)
    setError('')
    setOrderStatus('儲存順序中...')
    try {
      await reorderSiteImages(config.category, reordered.map(image => image.id))
      setOrderStatus('順序已儲存')
    } catch (err) {
      setImages(previous)
      setOrderStatus('')
      setError((err as Error).message)
    }
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
      <div className={styles.listHeader}>
        <h3 className={styles.sectionTitle}>目前的圖片（{images.length}）</h3>
        {images.length > 1 && (
          <span role="status" className={styles.orderStatus}>
            {orderStatus || '拖曳圖片右上角的編號可以調整順序'}
          </span>
        )}
      </div>
      {loading ? (
        <p className="loading">載入中...</p>
      ) : images.length === 0 ? (
        <p className="card empty">還沒有圖片，從上方上傳第一張。</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{ announcements: createAnnouncements(images), screenReaderInstructions }}
        >
          {/* rectSortingStrategy：用在多欄的格狀排列，項目可以上下左右移動 */}
          <SortableContext items={images.map(image => image.id)} strategy={rectSortingStrategy}>
            <ul className={styles.grid}>
              {images.map((image, index) => (
                // key 用 id 而不是 index：順序改變時，每張卡片編輯到一半的內容會跟著那張圖片走
                <SortableSiteImageCard
                  key={image.id}
                  image={image}
                  position={index + 1}
                  config={config}
                  onSaved={handleSaved}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </>
  )
}