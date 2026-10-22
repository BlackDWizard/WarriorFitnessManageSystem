import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { apiFetch } from './api'
import type { Member } from './types'

type FormState = {
  memberName: string
  memberPhoneNo: string
  memberEmail: string
  memberType: string
  memberPaidAmount: string
  memberValidUntil: string
  memberRemark: string
}

const emptyForm: FormState = {
  memberName: '',
  memberPhoneNo: '',
  memberEmail: '',
  memberType: '',
  memberPaidAmount: '',
  memberValidUntil: '',
  memberRemark: '',
}

export default function MemberForm() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    apiFetch<Member>(`/api/members/${id}`)
      .then(m => setForm({
        memberName: m.memberName,
        memberPhoneNo: m.memberPhoneNo ?? '',
        memberEmail: m.memberEmail ?? '',
        memberType: m.memberType ?? '',
        memberPaidAmount: m.memberPaidAmount?.toString() ?? '',
        memberValidUntil: m.memberValidUntil ?? '',
        memberRemark: m.memberRemark ?? '',
      }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function update(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.memberName.trim()) {
      setError('會員姓名為必填')
      return
    }

    const body = {
      memberName: form.memberName.trim(),
      memberPhoneNo: form.memberPhoneNo || null,
      memberEmail: form.memberEmail || null,
      memberType: form.memberType || null,
      memberPaidAmount: form.memberPaidAmount === '' ? null : Number(form.memberPaidAmount),
      memberValidUntil: form.memberValidUntil || null,
      memberRemark: form.memberRemark || null,
    }

    setSaving(true)
    setError('')
    try {
      await apiFetch(isEdit ? `/api/members/${id}` : '/api/members', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      })
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }
  if (loading) return <p className="loading">載入中...</p>

  return (
    <>
      <div className="page-header">
        <h2>{isEdit ? '編輯會員' : '新增會員'}</h2>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        {error && <p className="alert alert-error" role="alert">{error}</p>}

        <label className="field">
          <span className="field-label">姓名<span className="required">＊</span></span>
          <input value={form.memberName} onChange={e => update('memberName', e.target.value)} />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">電話</span>
            <input type="tel" value={form.memberPhoneNo} onChange={e => update('memberPhoneNo', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" value={form.memberEmail} onChange={e => update('memberEmail', e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span className="field-label">方案</span>
          <input value={form.memberType} onChange={e => update('memberType', e.target.value)} />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">繳費金額</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.memberPaidAmount}
              onChange={e => update('memberPaidAmount', e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">到期日</span>
            <input type="date" value={form.memberValidUntil} onChange={e => update('memberValidUntil', e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span className="field-label">備註</span>
          <textarea value={form.memberRemark} onChange={e => update('memberRemark', e.target.value)} />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '儲存中...' : '儲存'}</button>
          <button type="button" className="btn" onClick={() => navigate('/')}>取消</button>
        </div>
      </form>
    </>
  )
}