import { useSyncExternalStore } from 'react'
import type { SessionInfo } from './types'

// 登入狀態放在 React 外面的一個小 store：
// api.ts（不是 React 元件）和畫面都要讀寫它，用 useSyncExternalStore 讓畫面跟著更新
export type SessionState =
  | { status: 'checking' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; username: string; displayName: string; expiresAt: number }

let state: SessionState = { status: 'checking' }
const listeners = new Set<() => void>()

function setState(next: SessionState) {
  state = next
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSession() {
  return useSyncExternalStore(subscribe, () => state)
}

// 伺服器給的是「剩幾秒」，換算成本機時間的到期時間點，不受兩邊時鐘誤差影響
export function markSignedIn(info: SessionInfo) {
  setState({
    status: 'signedIn',
    username: info.username,
    displayName: info.displayName,
    expiresAt: Date.now() + info.expiresInSeconds * 1000,
  })
}

export function updateExpiresIn(seconds: number) {
  if (state.status === 'signedIn') {
    setState({ ...state, expiresAt: Date.now() + seconds * 1000 })
  }
}

export function markSignedOut() {
  if (state.status !== 'signedOut') {
    setState({ status: 'signedOut' })
  }
}