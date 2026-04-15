import type { Apartment } from '../types'

const KEY = 'recentApartments'
const MAX = 5

export const saveRecentApartment = (apt: Apartment): void => {
  try {
    const existing: Apartment[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    const filtered = existing.filter(a => a.aptId !== apt.aptId)
    const updated  = [apt, ...filtered].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

export const getRecentApartments = (): Apartment[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export const clearRecentApartments = (): void => {
  localStorage.removeItem(KEY)
}
