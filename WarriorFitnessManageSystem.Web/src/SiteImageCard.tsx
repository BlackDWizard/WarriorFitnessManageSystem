import { useState } from 'react'
import type { SiteImageCategoryConfig } from './siteImageCategories'
import { updateSiteImage } from './siteImages'
import type { SiteImageItem } from './types'
import styles from './SiteImageManager.module.css'

type Props = {
  image: SiteImageItem
  config: SiteImageCategoryConfig
  onSaved: (updated: SiteImageItem) => void
  onDelete: (image: SiteImageItem) => void
}

export default function SiteImageCard({ image, config, onSaved, onDelete }: Props) {
  // 編輯中的值先存在卡片自己的 state，按「儲存」才送出
  const [altText, setAltText] = useState(image.altText)
  const [linkUrl, setLinkUrl] = useState(image.linkUrl ?? '')
  const [isVisible, setIsVisible] = useState(image.isVisible)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 有沒有改過：跟目前存在資料庫的值比較，沒改過就不能按儲存
  const dirty =
    altText !== image.altText ||
    linkUrl !== (image.linkUrl ?? '') ||
    isVisible !== image.isVisible

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const updated = await updateSiteImage(image.id, {
        altText,
        linkUrl: linkUrl.trim() || null,
        isVisible,
      })
      onSaved(updated)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className={`card ${styles.card}`}>
      <div
        className={image.isVisible ? styles.thumb : `${styles.thumb} ${styles.thumbHidden}`}
        style={{ aspectRatio: config.aspectRatio }}
      >
        <img src={image.url} alt={image.altText || '未填寫替代文字'} loading="lazy" className={styles.thumbImage} />
        {!image.isVisible && <span className={`badge badge-muted ${styles.hiddenBadge}`}>前台未顯示</span>}
      </div>

      <div className={styles.cardBody}>
        <label className="field">
          <span className="field-label">替代文字</span>
          <input
            value={altText}
            maxLength={200}
            placeholder="描述圖片內容，例如：十月新會員首月五折"
            onChange={e => setAltText(e.target.value)}
          />
        </label>

        {config.supportsLink && (
          <label className="field">
            <span className="field-label">點擊後前往（選填）</span>
            <input
              inputMode="url"
              value={linkUrl}
              placeholder="https://… 或 /pricing"
              onChange={e => setLinkUrl(e.target.value)}
            />
          </label>
        )}

        <label className={styles.toggle}>
          <input type="checkbox" checked={isVisible} onChange={e => setIsVisible(e.target.checked)} />
          在前台顯示
        </label>

        {error && <p className="alert alert-error" role="alert">{error}</p>}

        <div className="btn-group">
          <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(image)}>
            刪除
          </button>
        </div>
      </div>
    </article>
  )
}