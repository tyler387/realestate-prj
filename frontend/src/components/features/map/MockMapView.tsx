import { useMapFilterStore } from '../../../stores/mapFilterStore'
import { mockPopularApartments } from '../../../data/mockApartmentData'
import { formatPriceShort } from '../../../utils/formatPrice'
import { FilterPanel } from './FilterPanel'

export const MockMapView = () => {
  const { dealType } = useMapFilterStore()

  const filteredMock = mockPopularApartments.filter(() => {
    // mock은 전부 매매로 가정 → 전세 필터 시 빈 결과
    if (dealType === 'JEONSE') return false
    return true
  })

  return (
    <div className="relative flex-1 w-full overflow-hidden bg-gray-100">
      <FilterPanel />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-sm text-gray-400">지도 영역 (KakaoMap SDK 연동 예정)</p>
      </div>

      {filteredMock.map((apt, i) => (
        <button
          key={apt.aptId}
          className="absolute bg-white border border-blue-400 rounded-xl
                     px-2 py-0.5 text-xs font-semibold text-blue-700 shadow-sm
                     hover:bg-blue-50 transition-colors"
          style={{
            top:  `${20 + i * 12}%`,
            left: `${15 + i * 13}%`,
          }}
        >
          {formatPriceShort(235000)}
        </button>
      ))}
    </div>
  )
}
