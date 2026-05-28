import type { AdSlotType } from '../types/ad'
import { USE_MOCK_AD } from '../data/mockAdData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export const trackImpression = async (
  adId: string,
  slot: AdSlotType
): Promise<void> => {
  if (USE_MOCK_AD) return

  try {
    await fetch(`${API_BASE_URL}/api/ads/impression`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, slot, timestamp: new Date().toISOString() }),
    })
  } catch {
    // fire-and-forget — 실패해도 UI 영향 없음
  }
}

export const trackClick = async (
  adId: string,
  slot: AdSlotType
): Promise<void> => {
  if (USE_MOCK_AD) return

  try {
    await fetch(`${API_BASE_URL}/api/ads/click`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, slot, timestamp: new Date().toISOString() }),
    })
  } catch {
    // fire-and-forget
  }
}
