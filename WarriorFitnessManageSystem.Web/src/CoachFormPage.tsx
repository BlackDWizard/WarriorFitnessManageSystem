import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ImageUploader from './ImageUploader'
import { createCoach, fetchCoach, updateCoach, type CoachInput } from './coaches'
import styles from './Coach.module.css'

const MAX_SPECIALTIES = 10

// 專長輸入框：用逗號、頓號或換行分隔，例如「增肌減脂、運動傷害預防」
function parseSpecialties(text: string) {
  return [...new Set(text.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean))]
}

type FormState = {
  name: string
  title: string
  specialtiesText: string
  bio: string
  photoPath: string | null
  photoUrl: string | null
  isVisible: boolean
}

const emptyForm: FormState = {
  name: '',
  title: '',
  specialtiesText: '',
  bio: '',
  photoPath: null,
  photoUrl: null,
  isVisible: true,
}

export default function CoachFormPage() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploaderKey, setUploaderKey] = useState(0)

  useEffect(() => {
    if (!isEdit) return
    fetchCoach(id)
      .then(c => setForm({
        name: c.name,
        title: c.title,
        specialtiesText: c.specialties.join('、'),
        bio: c.bio,
        photoPath: c.photoPath,
        photoUrl: c.photoUrl,
        isVisible: c.isVisible,
      }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const specialties = parseSpecialties(form.specialtiesText)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('請填寫教練姓名')
      return
    }
    if (specialties.length > MAX_SPECIALTIES) {
      setError(`專長最多 ${MAX_SPECIALTIES} 項`)
      return
    }

    const input: CoachInput = {
      name: form.name.trim(),
      title: form.title.trim(),
      specialties,
      bio: form.bio.trim(),
      photoPath: form.photoPath,
      isVisible: form.isVisible,
    }

    setSaving(true)
    setError('')
    try {
      if (isEdit) await updateCoach(id, input)
      else await createCoach(input)
      navigate('/coaches')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function removePhoto() {
    setForm(prev => ({ ...prev, photoPath: null, photoUrl: null }))
    setUploaderKey(key => key + 1)
  }

  if (loading) return <p className="loading">載入中...</p>

  return (
    <>
      <div className="page-header">
        <h2>{isEdit ? '編輯教練' : '新增教練'}</h2>
      </div>

      <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
        {error && <p className="alert alert-error" role="alert">{error}</p>}

        <div className={styles.formLayout}>
          <div className={styles.photoColumn}>
            <span className="field-label">照片</span>
            {/* 目前的照片（包含剛上傳、還沒按儲存的新照片） */}
            <div className={styles.currentPhoto}>
              {form.photoUrl
                ? <img src={form.photoUrl} alt="目前的照片" />
                : <span className={styles.noPhoto}>尚未上傳照片</span>}
            </div>
            {/* 照片已經顯示在上面了，上傳元件只留按鈕和狀態文字 */}
            <ImageUploader
              key={uploaderKey}
              showPreview={false}
              buttonLabel={form.photoUrl ? '更換照片' : '上傳照片'}
              onUploaded={uploaded => setForm(prev => ({ ...prev, photoPath: uploaded.path, photoUrl: uploaded.url }))}
            />
            {form.photoPath && (
              <button type="button" className="btn btn-sm btn-danger" onClick={removePhoto}>
                移除照片
              </button>
            )}
            <p className={styles.hint}>建議使用直式照片（3:4），臉部在畫面上半部。按下「儲存」後才會生效。</p>
          </div>

          <div className="form">
            <div className="field-row">
              <label className="field">
                <span className="field-label">姓名<span className="required">＊</span></span>
                <input value={form.name} maxLength={50} onChange={e => update('name', e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">職稱</span>
                <input value={form.title} maxLength={50} placeholder="例如：總教練" onChange={e => update('title', e.target.value)} />
              </label>
            </div>

            <label className="field">
              <span className="field-label">專長</span>
              <input
                value={form.specialtiesText}
                placeholder="用逗號或頓號分隔，例如：增肌減脂、運動傷害預防"
                onChange={e => update('specialtiesText', e.target.value)}
              />
            </label>
            {/* 即時預覽拆出來的專長標籤，教練打字時就知道分隔得對不對 */}
            {specialties.length > 0 && (
              <ul className={styles.tags} aria-label="專長預覽">
                {specialties.map(s => <li key={s} className={styles.tag}>{s}</li>)}
              </ul>
            )}

            <label className="field">
              <span className="field-label">自我介紹</span>
              <textarea
                value={form.bio}
                maxLength={1000}
                rows={8}
                placeholder="教學經歷、證照、教學理念……可以換行"
                onChange={e => update('bio', e.target.value)}
              />
              <span className={styles.counter}>{form.bio.length} / 1000</span>
            </label>

            <label className={styles.toggle}>
              <input type="checkbox" checked={form.isVisible} onChange={e => update('isVisible', e.target.checked)} />
              在前台顯示
            </label>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '儲存中...' : '儲存'}</button>
              <Link to="/coaches" className="btn">取消</Link>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}