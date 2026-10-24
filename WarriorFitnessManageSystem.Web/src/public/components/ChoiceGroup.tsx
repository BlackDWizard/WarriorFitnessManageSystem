import type { ChoiceOption } from '../bookingOptions'
import styles from './ChoiceGroup.module.css'

type Props = {
  name: string
  legend: string
  options: readonly ChoiceOption[]
  required?: boolean
  error?: string
} & (
  | { multiple?: false; value: string; onChange: (value: string) => void }
  | { multiple: true; value: string[]; onChange: (value: string[]) => void }
)

// 一組單選（radio）或複選（checkbox）。用 fieldset + legend 包起來，
// 螢幕報讀器會先唸題目，再唸每個選項
export default function ChoiceGroup(props: Props) {
  const { name, legend, options, required, error } = props

  function isChecked(value: string) {
    return props.multiple ? props.value.includes(value) : props.value === value
  }

  function toggle(value: string, checked: boolean) {
    if (props.multiple) {
      props.onChange(checked ? [...props.value, value] : props.value.filter(v => v !== value))
    } else {
      props.onChange(value)
    }
  }

  return (
    <fieldset className={styles.group} id={`field-${name}`} aria-invalid={error ? true : undefined}>
      <legend className={styles.legend}>
        {legend}
        {required && <span className={styles.required}>＊</span>}
        {props.multiple && <span className={styles.hint}>（可複選）</span>}
      </legend>
      <div className={styles.options}>
        {options.map(option => (
          <label key={option.value} className={styles.option}>
            <input
              type={props.multiple ? 'checkbox' : 'radio'}
              name={name}
              value={option.value}
              checked={isChecked(option.value)}
              onChange={e => toggle(option.value, e.target.checked)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </fieldset>
  )
}
