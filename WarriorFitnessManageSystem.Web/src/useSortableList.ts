import { useState } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

type Options<T extends { id: string }> = {
  items: T[]
  setItems: (items: T[]) => void
  // 把新順序存到後端
  save: (ids: string[]) => Promise<void>
  onError: (message: string) => void
  // 語音提示裡的名詞，例如「圖片」、「教練」
  itemName: string
}

// 拖曳排序的共用邏輯：感應器、樂觀更新、失敗還原、中文語音提示
// 網站圖片、教練、之後的表單欄位都用這一個 hook
export function useSortableList<T extends { id: string }>({ items, setItems, save, onError, itemName }: Options<T>) {
  const [status, setStatus] = useState('')

  // PointerSensor：滑鼠和觸控都適用，移動超過 5px 才開始拖曳；KeyboardSensor：鍵盤也能排序
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // 放開時：畫面先換成新順序，再送到後端；失敗就換回原本的順序
  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return

    const previous = items
    const oldIndex = items.findIndex(item => item.id === active.id)
    const newIndex = items.findIndex(item => item.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)

    setItems(reordered)
    setStatus('儲存順序中...')
    try {
      await save(reordered.map(item => item.id))
      setStatus('順序已儲存')
    } catch (err) {
      setItems(previous)
      setStatus('')
      onError((err as Error).message)
    }
  }

  const positionOf = (id: string | number) => items.findIndex(item => item.id === id) + 1

  const announcements: Announcements = {
    onDragStart: ({ active }) => `拿起第 ${positionOf(active.id)} 個${itemName}`,
    onDragOver: ({ over }) => (over ? `移到第 ${positionOf(over.id)} 個位置` : '目前不在排序範圍內'),
    onDragEnd: ({ over }) => (over ? `放在第 ${positionOf(over.id)} 個位置` : '已放下，順序沒有改變'),
    onDragCancel: () => '已取消拖曳，順序沒有改變',
  }

  return {
    status,
    // 直接展開到 <DndContext {...dndProps}> 上
    dndProps: {
      sensors,
      onDragEnd: handleDragEnd,
      accessibility: {
        announcements,
        screenReaderInstructions: {
          draggable: `按空白鍵拿起${itemName}，用方向鍵移動位置，再按一次空白鍵放下，按 Esc 取消。`,
        },
      },
    },
  }
}