import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../../stores/userStore'
import type { AdFallbackContent, AdSlotType } from '../../../types/ad'

const FALLBACK_MAP: Record<AdSlotType, AdFallbackContent> = {
  RIGHT_SIDEBAR_MIDDLE: {
    label:    '실거래 정보 확인하기',
    linkPath: '/trade',
  },
  RIGHT_SIDEBAR_BOTTOM: {
    label:    '지도에서 아파트 찾기',
    linkPath: '/map',
  },
}

export const AdFallback = ({ slot }: { slot: AdSlotType }) => {
  const navigate      = useNavigate()
  const fallback      = FALLBACK_MAP[slot]
  const apartmentName = useUserStore(s => s.apartmentName)

  return (
    <div
      onClick={() => navigate(fallback.linkPath)}
      className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-4
                 cursor-pointer hover:bg-blue-100 transition-colors"
    >
      <p className="text-xs text-blue-400 mb-1">추천</p>
      <p className="text-sm font-semibold text-blue-700 truncate">
        {apartmentName
          ? `${apartmentName} ${fallback.label}`
          : fallback.label}
      </p>
      <p className="text-xs text-blue-500 mt-1">›</p>
    </div>
  )
}
