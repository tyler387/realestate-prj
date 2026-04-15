import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mockAds, USE_MOCK_AD, selectWeightedAd } from '../data/mockAdData'
import type { Ad, AdSlotType } from '../types/ad'

export const useAd = (
  slot: AdSlotType,
  regionId: string,
  aptId: string
) => {
  // useMemo로 초기 랜덤 선택 1회 고정 (리렌더 시 재계산 방지)
  const mockAd = useMemo(
    () => selectWeightedAd(mockAds.filter(a => a.slot === slot)),
    [slot]
  )

  return useQuery<Ad | null>({
    queryKey: ['ads', slot, regionId, aptId],
    queryFn: () => {
      const params = new URLSearchParams({ slot, regionId })
      if (aptId) params.append('aptId', aptId)

      return fetch(`/api/ads?${params.toString()}`)
        .then(r => r.json())
        .then(data => {
          if (!data.success) throw new Error(data.error?.message)
          return (data.data[0] ?? null) as Ad | null
        })
    },
    enabled:     !USE_MOCK_AD,
    initialData: USE_MOCK_AD ? mockAd : undefined,
    staleTime:   1000 * 60 * 10,
    gcTime:      1000 * 60 * 20,
  })
}
