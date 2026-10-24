import { useEffect, useState } from 'react'
import { fetchPublicCoaches, type PublicCoach } from '../publicApi'

export type CoachesState =
  | { status: 'loading' }
  | { status: 'ready'; coaches: PublicCoach[] }
  | { status: 'error' }

export function useCoaches(): CoachesState {
  const [state, setState] = useState<CoachesState>({ status: 'loading' })

  useEffect(() => {
    let ignore = false
    fetchPublicCoaches()
      .then(coaches => { if (!ignore) setState({ status: 'ready', coaches }) })
      .catch(err => {
        console.error('載入教練資料失敗', err)
        if (!ignore) setState({ status: 'error' })
      })
    return () => { ignore = true }
  }, [])

  return state
}