import { useState, useEffect } from 'react'
import { useMapMarkers }    from '../../../hooks/useMapMarkers'
import { useDebounce }      from '../../../hooks/useDebounce'
import { FilterChip }       from '../map/FilterChip'
import { formatPriceShort } from '../../../utils/formatPrice'
import type { Apartment }   from '../../../types'
import type { MapDealType, MapFilters, MapMarkerItem } from '../../../types/map'

// MapMarkerItem → Apartment 변환
const toApartment = (item: MapMarkerItem): Apartment => ({
  aptId:   item.aptId,
  aptName: item.aptName,
  address: '',
  lat:     item.lat,
  lng:     item.lng,
})

// ── MapSection ────────────────────────────────────────────────────
export const MapSection = ({ onSelect }: { onSelect: (apt: Apartment) => void }) => {
  // 팝업 내 필터: 로컬 state (mapFilterStore 사용 안 함 — 독립)
  const [dealType, setDealType] = useState<MapDealType>(null)
  const debouncedDealType = useDebounce(dealType, 300)

  const localFilters: MapFilters = {
    dealType:  debouncedDealType,
    minPrice:  null,
    maxPrice:  null,
    areaRange: null,
  }

  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingApt, setPendingApt] = useState<MapMarkerItem | null>(null)

  const { mapContainerRef, mapInstanceRef, fetchMarkers } = useMapMarkers({
    filters:       localFilters,
    onMarkerClick: (apt) => setPendingApt(apt),
  })

  // ── SDK 로드 & 지도 초기화 ──────────────────────────────────
  useEffect(() => {
    const container = mapContainerRef.current
    let isMounted   = true

    if (!container) return

    const kakaoMapKey      = (import.meta.env.VITE_KAKAO_MAP_KEY ?? '').trim()
    const isPlaceholderKey = !kakaoMapKey || kakaoMapKey === 'YOUR_APP_KEY'

    if (isPlaceholderKey) {
      setLoadError('Kakao map key가 없습니다.')
      return
    }

    const loadSdk = async () => {
      if (window.kakao?.maps?.load) return
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-kakao-maps-sdk="true"]'
        )
        if (existing) {
          if (existing.dataset.loaded === 'true') { resolve(); return }
          existing.addEventListener('load',  () => resolve(),                            { once: true })
          existing.addEventListener('error', () => reject(new Error('SDK load failed')), { once: true })
          return
        }
        const script = document.createElement('script')
        script.dataset.kakaoMapsSdk = 'true'
        script.async = true
        script.src   = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=services,clusterer`
        script.onload  = () => { script.dataset.loaded = 'true'; resolve() }
        script.onerror = () => reject(new Error('SDK load failed'))
        document.head.appendChild(script)
      })
    }

    loadSdk()
      .then(() => {
        if (!isMounted || !window.kakao?.maps?.load) return

        window.kakao.maps.load(() => {
          if (!isMounted || !window.kakao?.maps) return
          if (mapInstanceRef.current) return

          mapInstanceRef.current = new window.kakao.maps.Map(container, {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780),
            level:  7,
          })

          window.kakao.maps.event.addListener(mapInstanceRef.current, 'idle', fetchMarkers)
          // 지도 빈 곳 클릭 → 선택 패널 닫기
          window.kakao.maps.event.addListener(mapInstanceRef.current, 'click', () => setPendingApt(null))
          fetchMarkers()
        })
      })
      .catch(() => {
        if (isMounted) setLoadError('Kakao Maps SDK 로드 실패')
      })

    return () => { isMounted = false }
  }, [])

  // ── 거래유형 필터 변경 → 마커 갱신 ────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) fetchMarkers()
  }, [debouncedDealType])

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 px-4 text-sm text-gray-500 text-center">
        {loadError}
      </div>
    )
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      {/* 팝업 내 간소화 필터 — 거래 유형만 */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                      flex gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow">
        <FilterChip label="전체" isSelected={!dealType}
          onClick={() => setDealType(null)} />
        <FilterChip label="매매" isSelected={dealType === 'SALE'}
          onClick={() => setDealType(dealType === 'SALE' ? null : 'SALE')} />
        <FilterChip label="전세" isSelected={dealType === 'JEONSE'}
          onClick={() => setDealType(dealType === 'JEONSE' ? null : 'JEONSE')} />
      </div>

      {/* 카카오맵 컨테이너 */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 마커 클릭 시 하단 선택 패널 */}
      {pendingApt && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3
                        flex items-center justify-between shadow-lg">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{pendingApt.aptName}</p>
            <p className="text-xs text-gray-400 truncate">{formatPriceShort(pendingApt.price)}</p>
          </div>
          <button
            onClick={() => onSelect(toApartment(pendingApt))}
            className="ml-3 flex-shrink-0 bg-blue-500 hover:bg-blue-600
                       text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            선택하기
          </button>
        </div>
      )}
    </div>
  )
}
