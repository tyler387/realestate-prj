import type { AdSlotType } from '../types/ad'

export const trackImpression = async (
  adId: string,
  slot: AdSlotType
): Promise<void> => {
  try {
    await fetch('/api/ads/impression', {
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
  try {
    await fetch('/api/ads/click', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, slot, timestamp: new Date().toISOString() }),
    })
  } catch {
    // fire-and-forget
  }
}
