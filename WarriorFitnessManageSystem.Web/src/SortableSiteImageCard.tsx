import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaGripVertical } from 'react-icons/fa6'
import SiteImageCard from './SiteImageCard'
import type { SiteImageCategoryConfig } from './siteImageCategories'
import type { SiteImageItem } from './types'
import styles from './SiteImageManager.module.css'

type Props = {
  image: SiteImageItem
  position: number
  config: SiteImageCategoryConfig
  onSaved: (updated: SiteImageItem) => void
  onDelete: (image: SiteImageItem) => void
}

// 把卡片包成「可以拖曳排序」的項目。卡片本身完全不知道拖曳的存在
export default function SortableSiteImageCard({ image, position, config, onSaved, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  // 拖曳中 dnd-kit 會算出這張卡片該移動多少，用 transform 移過去（不改變實際的 DOM 順序）
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? `${styles.sortableItem} ${styles.dragging}` : styles.sortableItem}
    >
      <SiteImageCard
        image={image}
        config={config}
        onSaved={onSaved}
        onDelete={onDelete}
        dragHandle={
          // 只有這個把手能拖曳：卡片裡還有輸入框，整張卡都能拖的話會沒辦法選取文字
          <button
            type="button"
            ref={setActivatorNodeRef}
            className={styles.dragHandle}
            aria-label={`第 ${position} 張，拖曳調整順序`}
            {...attributes}
            {...listeners}
          >
            <FaGripVertical aria-hidden="true" />
            <span>{position}</span>
          </button>
        }
      />
    </li>
  )
}