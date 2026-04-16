import { useEffect, useState } from 'react'
import { useMapFilterStore }   from '../stores/mapFilterStore'
import { useMapMarkers }       from '../hooks/useMapMarkers'
import { useDebounce }         from '../hooks/useDebounce'
import { FilterPanel }         from './features/map/FilterPanel'
import { ZoomControl }         from './features/map/ZoomControl'
import { ApartmentPanel }      from './features/map/ApartmentPanel'
import type { MapMarkerItem }  from '../types/map'
import type { ApartmentMarker } from '../types'

// MapMarkerItem → ApartmentMarker 변환 (ApartmentPanel 재사용용)
const toApartmentMarker = (item: MapMarkerItem): ApartmentMarker => ({
  id:                item.aptId as unknown as number,
  complexName:       item.aptName,
  eupMyeonDong:      '',
  latitude:          item.lat,
  longitude:         item.lng,
  latestSalePrice:   item.price,
  latestSaleArea:    null,
  latestTradeDate:   null,
})

export const MapView = () => {
  const filters = useMapFilterStore()

  // 객체 참조 문제 회피 — 개별 값 debounce
  const debouncedDealType  = useDebounce(filters.dealType,  300)
  const debouncedMinPrice  = useDebounce(filters.minPrice,  300)
  const debouncedMaxPrice  = useDebounce(filters.maxPrice,  300)
  const debouncedAreaRange = useDebounce(filters.areaRange, 300)

  const debouncedFilters = {
    dealType:  debouncedDealType,
    minPrice:  debouncedMinPrice,
    maxPrice:  debouncedMaxPrice,
    areaRange: debouncedAreaRange,
  }

  const [selectedApt, setSelectedApt] = useState<MapMarkerItem | null>(null)
  const [loadError,   setLoadError]   = useState<string | null>(null)

  const { mapContainerRef, mapInstanceRef, fetchMarkers } = useMapMarkers({
    filters:       debouncedFilters,
    onMarkerClick: (apt) => setSelectedApt(apt),
  })

  // ── SDK 로드 & 지도 초기화 ────────────────────────────────────
  useEffect(() => {
    const container = mapContainerRef.current
    let isMounted   = true

    if (!container) return

    const kakaoMapKey      = (import.meta.env.VITE_KAKAO_MAP_KEY ?? '').trim()
    const isPlaceholderKey = !kakaoMapKey || kakaoMapKey === 'YOUR_APP_KEY'

    if (isPlaceholderKey) {
      setLoadError('Kakao map key가 없습니다. 루트 .env의 VITE_KAKAO_MAP_KEY를 확인하세요.')
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
        const script       = document.createElement('script')
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
          if (mapInstanceRef.current) return  // 이미 초기화됨

          setLoadError(null)

          mapInstanceRef.current = new window.kakao.maps.Map(container, {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780),
            level:  5,  // 기본 줌 레벨 (호갱노노 기준 적정값)
          })

          // idle 이벤트 → throttle 500ms 마커 갱신
          window.kakao.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
            fetchMarkers()
          })

          fetchMarkers()
        })
      })
      .catch(() => {
        if (isMounted) setLoadError('Kakao Maps SDK 로드 실패')
      })

    return () => {
      isMounted = false
    }
  }, [])   // 마운트 1회

  // ── 필터 변경 → 마커 갱신 ─────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return
    fetchMarkers().catch(() => {})
  }, [debouncedDealType, debouncedMinPrice, debouncedMaxPrice, debouncedAreaRange])

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-700">
        {loadError}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        {/* FilterPanel — 지도 위 absolute */}
        <FilterPanel />

        {/* 카카오맵 컨테이너 */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 작은 커스텀 줌 컨트롤 */}
        <ZoomControl mapInstanceRef={mapInstanceRef} />
      </div>

      {/* 마커 클릭 시 하단 패널 */}
      <ApartmentPanel
        apartment={selectedApt ? toApartmentMarker(selectedApt) : null}
      />
    </div>
  )
}
