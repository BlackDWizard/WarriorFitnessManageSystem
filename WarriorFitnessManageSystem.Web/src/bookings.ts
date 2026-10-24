import { apiFetch } from './api'
import type { BookingDetail, BookingListItem } from './types'

export type BookingStatusFilter = 'pending' | 'handled' | 'all'

export function fetchBookings(status: BookingStatusFilter) {
  return apiFetch<BookingListItem[]>(`/api/bookings?status=${status}`)
}

export function fetchBooking(id: string) {
  return apiFetch<BookingDetail>(`/api/bookings/${id}`)
}

export function setBookingHandled(id: string, handled: boolean) {
  return apiFetch<BookingDetail>(`/api/bookings/${id}/handled`, {
    method: 'PUT',
    body: JSON.stringify({ handled }),
  })
}

export function deleteBooking(id: string) {
  return apiFetch<void>(`/api/bookings/${id}`, { method: 'DELETE' })
}