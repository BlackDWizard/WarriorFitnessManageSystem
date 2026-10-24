import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import SortableItem from './SortableItem'
import { deleteCoach, fetchCoaches, reorderCoaches } from './coaches'
import type { CoachItem } from './types'
import { useSortableList } from './useSortableList'
import styles from './Coach.module.css'

export default function CoachListPage() {
  const [coaches, setCoaches] = useState<CoachItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCoaches()
      .then(setCoaches)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const sortable = useSortableList({
    items: coaches,
    setItems: setCoaches,
    save: reorderCoaches,
    onError: setError,
    itemName: '教練',
  })

  async function handleDelete(coach: CoachItem) {
    if (!confirm(`確定要刪除「${coach.name}」嗎？刪除後無法復原。\n如果只是暫時不顯示，可以在編輯頁取消「在前台顯示」。`)) return
    setError('')
    try {
      await deleteCoach(coach.id)
      setCoaches(prev => prev.filter(c => c.id !== coach.id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>教練師資</h2>
        <Link to="/coaches/new" className="btn btn-primary">新增教練</Link>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className="list-header">
        <h3>目前的教練（{coaches.length}）</h3>
        {coaches.length > 1 && (
          <span role="status" className="list-status">
            {sortable.status || '拖曳卡片右上角的編號可以調整前台的顯示順序'}
          </span>
        )}
      </div>

      {loading ? (
        <p className="loading">載入中...</p>
      ) : coaches.length === 0 ? (
        <p className="card empty">還沒有教練資料，按右上角「新增教練」開始建立。</p>
      ) : (
        <DndContext {...sortable.dndProps} collisionDetection={closestCenter}>
          <SortableContext items={coaches.map(c => c.id)} strategy={rectSortingStrategy}>
            <ul className={styles.grid}>
              {coaches.map((coach, index) => (
                <SortableItem key={coach.id} id={coach.id} position={index + 1} itemName="教練">
                  {dragHandle => (
                    <article className={`card ${styles.card}`}>
                      <div className={coach.isVisible ? styles.photo : `${styles.photo} ${styles.photoHidden}`}>
                        {coach.photoUrl
                          ? <img src={coach.photoUrl} alt="" loading="lazy" />
                          : <span className={styles.noPhoto}>尚未上傳照片</span>}
                        {!coach.isVisible && <span className={`badge badge-muted ${styles.hiddenBadge}`}>前台未顯示</span>}
                        {dragHandle}
                      </div>
                      <div className={styles.cardBody}>
                        <p className={styles.name}>{coach.name}</p>
                        {coach.title && <p className={styles.title}>{coach.title}</p>}
                        <div className="btn-group">
                          <Link to={`/coaches/${coach.id}/edit`} className="btn btn-sm">編輯</Link>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(coach)}>
                            刪除
                          </button>
                        </div>
                      </div>
                    </article>
                  )}
                </SortableItem>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </>
  )
}