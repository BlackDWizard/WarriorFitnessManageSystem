import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaGripVertical } from 'react-icons/fa6'
import styles from './Sortable.module.css'

type Props = {
  id: string
  position: number
  itemName: string
  // render prop：把拖曳把手交給呼叫端，由呼叫端決定放在卡片的哪裡
  children: (dragHandle: ReactNode) => ReactNode
}

// 可以拖曳排序的清單項目（<li>）。項目裡要顯示什麼，完全由 children 決定
export default function SortableItem({ id, position, itemName, children }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const dragHandle = (
    // 只有這個把手能拖曳：卡片裡可能有輸入框，整張卡都能拖的話會沒辦法選取文字
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={styles.handle}
      aria-label={`第 ${position} 個${itemName}，拖曳調整順序`}
      {...attributes}
      {...listeners}
    >
      <FaGripVertical aria-hidden="true" />
      <span>{position}</span>
    </button>
  )

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? `${styles.item} ${styles.dragging}` : styles.item}
    >
      {children(dragHandle)}
    </li>
  )
}