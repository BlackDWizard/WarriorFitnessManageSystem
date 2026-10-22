import { useState } from 'react'
import ImageUploader from './ImageUploader'
import type { UploadedImage } from './types'

// 暫時的測試頁，Day 3 有正式的圖片管理頁後就刪掉
export default function UploadTestPage() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null)

  return (
    <>
      <div className="page-header">
        <h2>圖片上傳測試</h2>
      </div>

      <div className="card">
        <ImageUploader onUploaded={setUploaded} />

        {uploaded && (
          <dl style={{ marginBottom: 0 }}>
            <dt className="field-label">Storage 路徑</dt>
            <dd><code>{uploaded.path}</code></dd>
            <dt className="field-label">公開網址</dt>
            <dd className="qr-url">
              <a href={uploaded.url} target="_blank" rel="noreferrer">{uploaded.url}</a>
            </dd>
          </dl>
        )}
      </div>
    </>
  )
}