import { apiFetch } from './api'
import type { CoachItem } from './types'

export type CoachInput = {
  name: string
  title: string
  specialties: string[]
  bio: string
  photoPath: string | null
  isVisible: boolean
}

export function fetchCoaches() {
  return apiFetch<CoachItem[]>('/api/coaches')
}

export function fetchCoach(id: string) {
  return apiFetch<CoachItem>(`/api/coaches/${id}`)
}

export function createCoach(input: CoachInput) {
  return apiFetch<CoachItem>('/api/coaches', { method: 'POST', body: JSON.stringify(input) })
}

export function updateCoach(id: string, input: CoachInput) {
  return apiFetch<CoachItem>(`/api/coaches/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteCoach(id: string) {
  return apiFetch<void>(`/api/coaches/${id}`, { method: 'DELETE' })
}

export function reorderCoaches(ids: string[]) {
  return apiFetch<void>('/api/coaches/reorder', { method: 'PUT', body: JSON.stringify({ ids }) })
}