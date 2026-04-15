import { useEffect, useRef } from 'react'
import { useUserStore } from '../../../stores/userStore'
import { useAd } from '../../../hooks/useAdData'
import { trackImpression, trackClick } from '../../../utils/adTracking'
import { AdSlotSkeleton } from './AdSlotSkeleton'
import { AdFallback } from './AdFallback'
import type { AdSlotType } from '../../../types/ad'

type AdSlotProps = {
  slot: AdSlotType
}

export const AdSlot = ({ slot }: AdSlotProps) => {
  const apartmentId = useUserStore(s => s.apartmentId)
  const regionId    = 'seoul-songpa'
  const aptId       = apartmentId ? String(apartmentId) : ''

  const { data: ad, isLoading, isError } = useAd(slot, regionId, aptId)

  const adRef      = useRef<HTMLDivElement>(null)
  const hasTracked = useRef(false)

  // 단일 useEffect로 통합 — impression 트래킹 + 광고 교체 시 초기화
  useEffect(() => {
    if (!ad || !adRef.current) return

    hasTracked.current = false  // 새 광고 로드 시 초기화

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTracked.current) {
          hasTracked.current = true
          trackImpression(ad.adId, slot)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(adRef.current)
    return () => observer.disconnect()
  }, [ad?.adId, slot])

  const handleClick = () => {
    if (!ad) return
    trackClick(ad.adId, slot)
    window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) return <AdSlotSkeleton />
  if (isError || !ad) return <AdFallback slot={slot} />

  return (
    <div
      ref={adRef}
      className="bg-white rounded-xl border border-gray-100 p-4 mb-4"
    >
      <p className="text-xs text-gray-400 mb-2">광고</p>

      <div onClick={handleClick} className="cursor-pointer group">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          loading="lazy"
          className="w-full h-[120px] object-cover rounded-lg mb-2
                     group-hover:opacity-90 transition-opacity"
        />
        <p className="text-sm font-semibold text-gray-900 truncate">
          {ad.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {ad.description}
        </p>
      </div>
    </div>
  )
}
