import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Seo } from '../components/Seo'
import ChoiceGroup from '../components/ChoiceGroup'
import LineButton from '../components/LineButton'
import { NO_PREFERRED_COACH, OTHER_GOAL, bookingOptions, type ChoiceOption } from '../bookingOptions'
import { useCoaches } from '../hooks/useCoaches'
import { submitBooking, type BookingInput } from '../publicApi'
import { siteContent } from '../siteContent'
import buttons from '../styles/buttons.module.css'
import pageStyles from './Page.module.css'
import styles from './BookingFormPage.module.css'

const emptyForm: BookingInput = {
  source: '',
  course: '',
  goal: '',
  goalOther: '',
  healthNotes: '',
  name: '',
  gender: '',
  birthday: '',
  phone: '',
  email: '',
  lineId: '',
  contactMethod: '',
  preferredTime: '',
  hadCoachBefore: null,
  preferredCoach: '',
  helpNotes: '',
  consent: false,
  website: '',
}

type Errors = Partial<Record<keyof BookingInput, string>>

// 前端先檢查一次，客人馬上知道哪裡沒填；後端還會再檢查一次，那才是真正的把關
function validate(form: BookingInput): Errors {
  const errors: Errors = {}
  if (!form.source) errors.source = '請選擇您如何得知本店'
  if (!form.course) errors.course = '請選擇想報名的課程'
  if (!form.goal) errors.goal = '請選擇訓練目標'
  if (form.goal === OTHER_GOAL && !form.goalOther.trim()) errors.goalOther = '請簡單說明您的訓練目標'
  if (!form.healthNotes.trim()) errors.healthNotes = '沒有的話可以填「無」'
  if (!form.name.trim()) errors.name = '請填寫姓名'
  if (!form.gender) errors.gender = '請選擇性別'
  if (!form.birthday) errors.birthday = '請填寫出生年月日'
  if (!/^09\d{8}$/.test(form.phone.replace(/\D/g, ''))) errors.phone = '請填寫 09 開頭的 10 碼手機號碼'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = '請填寫正確的 Email'
  if (!form.lineId.trim()) errors.lineId = '請填寫 LINE ID'
  if (!form.contactMethod) errors.contactMethod = '請選擇希望的聯繫方式'
  if (!form.preferredTime.trim()) errors.preferredTime = '請填寫方便聯繫的時間'
  if (form.hadCoachBefore === null) errors.hadCoachBefore = '請選擇是否上過教練課'
  if (!form.preferredCoach) errors.preferredCoach = '請選擇偏好的教練'
  if (!form.consent) errors.consent = '請勾選同意後再送出'
  return errors
}

// 今天的日期（yyyy-MM-dd），生日不能選未來的日期
const today = new Date().toLocaleDateString('sv-SE')

export default function BookingFormPage() {
  const [form, setForm] = useState<BookingInput>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  // 偏好教練的選項：「不指定」加上目前在前台顯示的教練，教練名單在後台改了這裡就跟著變
  const coaches = useCoaches()
  const coachOptions: ChoiceOption[] = [
    { value: NO_PREFERRED_COACH, label: '不指定' },
    ...(coaches.status === 'ready' ? coaches.coaches.map(c => ({ value: c.name, label: c.name })) : []),
  ]

  function update<K extends keyof BookingInput>(field: K, value: BookingInput[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    // 改了某個欄位，就把那個欄位的錯誤訊息清掉
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)

    // 有錯誤就捲到第一個有問題的欄位
    const firstError = Object.keys(found)[0]
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      await submitBooking(form)
      setDone(true)
      window.scrollTo(0, 0)
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <section className={pageStyles.page}>
        <Seo title="預約體驗課" />
        <h1 className={pageStyles.title}>已收到你的預約</h1>
        <p className={styles.intro}>
          謝謝你，{form.name}！教練會在「{form.preferredTime}」用{form.contactMethod}跟你聯絡。
          {siteContent.social.line && '等不及的話，也可以直接加 LINE 問我們。'}
        </p>
        <div className={styles.doneActions}>
          <LineButton />
          <Link to="/" className={buttons.secondary}>回首頁</Link>
        </div>
      </section>
    )
  }

  // 文字欄位的共用寫法：標題、輸入框、錯誤訊息
  function textField(field: keyof BookingInput, label: string, options: {
    required?: boolean
    type?: string
    placeholder?: string
    autoComplete?: string
    inputMode?: 'tel' | 'email' | 'text'
    maxLength?: number
    multiline?: boolean
    min?: string
    max?: string
  } = {}) {
    const { required = true, type = 'text', multiline = false, maxLength = 100, ...rest } = options
    const value = form[field] as string
    const invalid = errors[field] ? true : undefined
    return (
      <label className={styles.field} id={`field-${field}`}>
        <span className={styles.label}>
          {label}
          {required && <span className={styles.required}>＊</span>}
        </span>
        {multiline ? (
          <textarea value={value} rows={3} maxLength={500} placeholder={rest.placeholder} aria-invalid={invalid}
            onChange={e => update(field, e.target.value as never)} />
        ) : (
          <input type={type} value={value} maxLength={maxLength} aria-invalid={invalid} {...rest}
            onChange={e => update(field, e.target.value as never)} />
        )}
        {errors[field] && <span className={styles.error}>{errors[field]}</span>}
      </label>
    )
  }

  return (
    <section className={pageStyles.page}>
      <Seo title="預約體驗課" />
      <h1 className={pageStyles.title}>預約體驗課</h1>
      <p className={styles.intro}>填寫下面的資料，教練會用你選的方式跟你聯絡、安排上課時間。標示 ＊ 的是必填。</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.sectionTitle}>關於課程</h2>

        <ChoiceGroup name="source" legend="📍您如何得知本店" required options={bookingOptions.sources}
          value={form.source} onChange={v => update('source', v)} error={errors.source} />
        <ChoiceGroup name="course" legend="🏋️您想報名哪項課程？" required options={bookingOptions.courses}
          value={form.course} onChange={v => update('course', v)} error={errors.course} />
        <ChoiceGroup name="goal" legend="🎯您的訓練目標" required options={bookingOptions.goals}
          value={form.goal} onChange={v => update('goal', v)} error={errors.goal} />
        {/* 選「其他」才出現說明欄 */}
        {form.goal === OTHER_GOAL && textField('goalOther', '請說明您的訓練目標', { placeholder: '例如：改善駝背、產後恢復' })}

        <ChoiceGroup name="preferredCoach" legend="🙋🏻‍♂️🙋🏻‍♀️偏好教練" required options={coachOptions}
          value={form.preferredCoach} onChange={v => update('preferredCoach', v)} error={errors.preferredCoach} />
        <ChoiceGroup name="hadCoachBefore" legend="您是否上過教練課" required options={bookingOptions.yesNo}
          value={form.hadCoachBefore === null ? '' : form.hadCoachBefore ? '是' : '否'}
          onChange={v => update('hadCoachBefore', v === '是')} error={errors.hadCoachBefore} />

        {textField('healthNotes', '您是否曾經手術或是受傷影響運動的狀況（如有請簡單說明）', {
          multiline: true, placeholder: '例如：前年膝蓋手術、久坐腰痠；沒有的話填「無」',
        })}
        {textField('helpNotes', '您最希望我們如何幫助您／指定哪位教練', { required: false, multiline: true })}

        <h2 className={styles.sectionTitle}>聯絡資料</h2>

        <div className={styles.row}>
          {textField('name', '您的姓名', { autoComplete: 'name', maxLength: 50 })}
          {textField('birthday', '您的出生年月日', { type: 'date', autoComplete: 'bday', min: '1900-01-01', max: today })}
        </div>

        <ChoiceGroup name="gender" legend="您的性別" required options={bookingOptions.genders}
          value={form.gender} onChange={v => update('gender', v)} error={errors.gender} />

        <div className={styles.row}>
          {textField('phone', '手機號碼', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '0912345678' })}
          {textField('email', 'Email', { type: 'email', inputMode: 'email', autoComplete: 'email' })}
        </div>

        <div className={styles.row}>
          {textField('lineId', 'LINE ID')}
          {textField('preferredTime', '方便與您聯繫的時間', { placeholder: '例：平日上午' })}
        </div>

        <ChoiceGroup name="contactMethod" legend="我們將如何聯繫您" required options={bookingOptions.contactMethods}
          value={form.contactMethod} onChange={v => update('contactMethod', v)} error={errors.contactMethod} />

        {/* 防機器人的隱藏欄位：畫面上看不到、Tab 也跳不到，只有自動亂填所有欄位的機器人會填 */}
        <div className={styles.honeypot} aria-hidden="true">
          <label>
            網站
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => update('website', e.target.value)} />
          </label>
        </div>

        <label className={styles.consent} id="field-consent">
          <input type="checkbox" checked={form.consent} onChange={e => update('consent', e.target.checked)} />
          <span>
            我同意 {siteContent.brandName} 蒐集並使用以上資料（包含身體狀況），僅用於安排課程與聯繫我。
          </span>
        </label>
        {errors.consent && <p className={styles.error}>{errors.consent}</p>}

        {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}

        <button type="submit" className={`${buttons.primary} ${styles.submit}`} disabled={submitting}>
          {submitting ? '送出中...' : '送出預約'}
        </button>
      </form>
    </section>
  )
}
