// 預約表單的選項。value 是存進資料庫的值，要跟後端 BookingRules.cs 一致；
// label 是畫面上顯示的文字，可以加表情符號，改 label 不影響資料
export type ChoiceOption = { value: string; label: string }

const plain = (values: string[]): ChoiceOption[] => values.map(value => ({ value, label: value }))

export const OTHER_GOAL = '其他'
export const NO_PREFERRED_COACH = '不指定'

export const bookingOptions = {
  sources: plain(['傳單', '親友介紹', '網路廣告', '招牌', '路過']),
  courses: plain(['預售中健身體驗課588元（1人）', '一對一教練課程', '一對一肌肉筋膜放鬆課程', '一對二教練課程']),
  goals: [
    { value: '增肌減脂', label: '增肌減脂' },
    { value: '增強肌耐力', label: '增強肌耐力💪🏽' },
    { value: '準備比賽', label: '準備比賽🏅' },
    { value: '我只是想運動', label: '我只是想運動🏃' },
    { value: OTHER_GOAL, label: '其他' },
  ],
  genders: plain(['男', '女', '其他']),
  contactMethods: plain(['LINE', '電話']),
  yesNo: plain(['是', '否']),
}
