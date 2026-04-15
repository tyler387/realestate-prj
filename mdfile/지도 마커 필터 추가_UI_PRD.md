# 📄 지도 필터링 기반 아파트 마커 시스템 PRD
## v3.0 | 검증 완료 | Spring + React + KakaoMap 구현용

> **범위**: `/map` 지도 탭 + 아파트 검색 팝업(MapSection) 공용 마커 시스템
> **연관 PRD**: UI Frame v4 / 실거래 탭 v2 / 아파트 검색 팝업 v3 / 실거래 사이드바 v3
>
> **v3 검증 변경 요약**:
> - `debouncedFilters` 훅 내부 생성 + 외부 useEffect 의존 구조 불일치 → 훅 외부에서 debounce 처리로 변경
> - `fetchMarkers` stale closure 버그 (throttle이 초기 filters만 캡처) → fnRef 패턴으로 최신값 참조
> - `mapRef`를 DOM ref로 오용 → 컨테이너 ref(`mapContainerRef`)와 지도 객체 ref(`mapInstanceRef`) 분리
> - `clearMarkers`에서 clusterer 마커를 `setMap(null)` 중복 제거 → clusterer.clear() 전용 처리로 분리
> - `MockMapSection` 컴포넌트 미명세 → 명세 추가
> - `USE_KAKAO_MAP` 분산 선언 → `config/featureFlags.ts` 단일 파일로 통일
> - `buildParams` import 누락 → import 추가
> - CustomOverlay + 투명 Marker 이중 구조에서 Overlay 미제거 버그 → overlaysRef 별도 관리

---

# 1. 개요

## 목적

사용자가 가격·거래유형·평형 조건을 설정하면 해당 조건의 아파트만 지도 마커로 표시.

- 지도 기반 데이터 탐색 UX
- 필터 기반 마커 렌더링
- 줌 레벨 기반 데이터 밀도 제어
- 대량 마커 성능 최적화 (클러스터링)

## 두 진입점

| 진입점 | 컴포넌트 | 목적 | 필터 상태 |
|--------|---------|------|---------|
| `/map` 탭 | `MapPage` → `MapView` | 전체 탐색 지도 | `mapFilterStore` (전역) |
| 아파트 선택 팝업 | `ApartmentSelectModal` → `MapSection` | 커뮤니티 진입용 선택 | 로컬 useState |

> 두 진입점 모두 공용 훅 `useMapMarkers`를 통해 동일한 마커 로직 사용.

---

# 2. 기존 PRD 연관 관계

| 항목 | 기존 PRD | 이 PRD |
|------|---------|--------|
| 가격 단위 | 만원 | **만원** (통일) |
| `formatPriceShort` | `utils/format.ts` | 마커 가격 표시 재사용 |
| `useDebounce` | 아파트 검색 팝업 v3 | 재사용 |
| `useThrottle` | 아파트 검색 팝업 v3 | 재사용 (fnRef 패턴) |
| `TradeFilterStore` | 실거래 사이드바 v3 | 별도 `mapFilterStore` |
| `USE_KAKAO_MAP` | 아파트 검색 팝업 v3 | 동일 플래그, 단일 파일 |

---

# 3. 기술 스택

| 항목 | 버전 | 용도 |
|------|------|------|
| React | 18+ | UI |
| TypeScript | 5+ | 타입 |
| Tailwind CSS | 3+ | 스타일 |
| Zustand | 4+ | mapFilterStore |
| KakaoMap JS SDK | — | 지도 (mock 대체 가능) |
| Spring Boot | 3+ | 마커 조회 API |

---

# 4. Feature Flags — 단일 파일

> ⚠️ **[수정]** v2에서 `USE_KAKAO_MAP`이 `useMapMarkers.ts`와 기타 파일에 분산 선언.
> 플래그 불일치 방지를 위해 **단일 파일**에서 관리.

```ts
// config/featureFlags.ts

export const USE_KAKAO_MAP   = false   // KakaoMap SDK 연동 전까지 false
export const USE_MOCK_SEARCH = true    // 아파트 검색 팝업 v3과 동일
export const USE_MOCK_AD     = true    // 광고 시스템 v3과 동일
```

---

# 5. 데이터 타입

```ts
// types/map.ts

export type MapDealType  = 'SALE' | 'JEONSE' | null
export type MapAreaRange = '20' | '30' | '40' | null

export type MapFilters = {
  dealType:  MapDealType
  minPrice:  number | null   // 만원 단위
  maxPrice:  number | null   // 만원 단위
  areaRange: MapAreaRange
}

export type MapBounds = {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export type MapMarkerItem = {
  aptId:   string
  aptName: string
  lat:     number
  lng:     number
  price:   number    // 만원 단위
}
```

---

# 6. 상태 관리

## 6.1 mapFilterStore (지도 탭 전용)

```ts
// stores/mapFilterStore.ts
import { create } from 'zustand'
import type { MapDealType, MapAreaRange } from '../types/map'

type MapFilterState = {
  dealType:  MapDealType
  minPrice:  number | null
  maxPrice:  number | null
  areaRange: MapAreaRange

  setDealType:  (v: MapDealType) => void
  setMinPrice:  (v: number | null) => void
  setMaxPrice:  (v: number | null) => void
  setAreaRange: (v: MapAreaRange) => void
  resetFilters: () => void
}

export const useMapFilterStore = create<MapFilterState>((set) => ({
  dealType:  null,
  minPrice:  null,
  maxPrice:  null,
  areaRange: null,

  setDealType:  (dealType)  => set({ dealType }),
  setMinPrice:  (minPrice)  => set({ minPrice }),
  setMaxPrice:  (maxPrice)  => set({ maxPrice }),
  setAreaRange: (areaRange) => set({ areaRange }),
  resetFilters: () => set({ dealType: null, minPrice: null, maxPrice: null, areaRange: null }),
}))
```

## 6.2 KakaoMap ref 구조 (분리)

> ⚠️ **[수정]** v2에서 `mapRef`를 `kakao.maps.Map` 타입으로 선언한 뒤
> `<div ref={mapRef as any}>`로 DOM ref에 연결 → 타입 오류 + 의미 혼란.
> **컨테이너 ref**와 **지도 인스턴스 ref**를 명확히 분리.

```ts
// DOM 요소 ref (div에 연결)
const mapContainerRef = useRef<HTMLDivElement>(null)

// KakaoMap 인스턴스 ref (지도 객체 보관)
const mapInstanceRef  = useRef<kakao.maps.Map | null>(null)

// 마커 / 오버레이 / 클러스터 ref
const markersRef   = useRef<kakao.maps.Marker[]>([])
const overlaysRef  = useRef<kakao.maps.CustomOverlay[]>([])  // ⚠️ 신규
const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null)
```

---

# 7. 공용 훅 — useMapMarkers

> ⚠️ **[수정 핵심 1]** v2에서 `debouncedFilters`를 훅 내부에서 생성하고
> 외부 `useEffect([debouncedFilters])`에서 의존성으로 사용하는 구조.
> 훅 내부 state 변경이 외부 컴포넌트를 자동으로 리렌더하지 않을 수 있음.
> **debounce를 훅 외부(MapView 컴포넌트)에서 처리**하고 훅에는 일반 filters 전달.
>
> ⚠️ **[수정 핵심 2]** `fetchMarkers`를 throttle로 감쌀 때 내부에서 `debouncedFilters`를
> 클로저로 캡처하면 throttle 생성 시점의 초기값만 사용하는 stale closure 버그 발생.
> fnRef 패턴(아파트 검색 팝업 v3)과 동일하게 filters를 ref로 관리.

```ts
// hooks/useMapMarkers.ts
import { useRef, useCallback, useEffect } from 'react'
import { useThrottle }       from './useThrottle'
import { formatPriceShort }  from '../utils/format'
import { buildParams }       from '../utils/mapParamBuilder'
import { USE_KAKAO_MAP }     from '../config/featureFlags'
import type { MapMarkerItem, MapBounds, MapFilters } from '../types/map'

type UseMapMarkersParams = {
  filters:       MapFilters          // 이미 debounce 처리된 값을 받음
  onMarkerClick: (apt: MapMarkerItem) => void
}

export const useMapMarkers = ({ filters, onMarkerClick }: UseMapMarkersParams) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef  = useRef<kakao.maps.Map | null>(null)
  const markersRef      = useRef<kakao.maps.Marker[]>([])
  const overlaysRef     = useRef<kakao.maps.CustomOverlay[]>([])
  const clustererRef    = useRef<kakao.maps.MarkerClusterer | null>(null)

  // stale closure 방지 — filters를 ref로 최신값 유지
  const filtersRef        = useRef<MapFilters>(filters)
  const onMarkerClickRef  = useRef(onMarkerClick)

  useEffect(() => { filtersRef.current       = filters       }, [filters])
  useEffect(() => { onMarkerClickRef.current = onMarkerClick }, [onMarkerClick])

  // bounds 계산
  const getBounds = (): MapBounds | null => {
    if (!mapInstanceRef.current) return null
    const bounds = mapInstanceRef.current.getBounds()
    return {
      minLat: bounds.getSouthWest().getLat(),
      maxLat: bounds.getNorthEast().getLat(),
      minLng: bounds.getSouthWest().getLng(),
      maxLng: bounds.getNorthEast().getLng(),
    }
  }

  // 마커 + 오버레이 전체 제거
  // ⚠️ [수정] clusterer에 추가된 마커는 clusterer.clear()로만 제거.
  // setMap(null)과 clusterer.clear() 중복 제거하면 오류 발생.
  // 클러스터 사용 여부에 따라 제거 경로 분리.
  const clearMarkers = useCallback(() => {
    // 오버레이 제거 (CustomOverlay는 markersRef에 없음 — 별도 overlaysRef)
    overlaysRef.current.forEach(ov => ov.setMap(null))
    overlaysRef.current = []

    if (clustererRef.current) {
      // 클러스터 사용 중 → clusterer.clear()로 마커 제거 (setMap(null) 불필요)
      clustererRef.current.clear()
    } else {
      // 클러스터 미사용 → 직접 setMap(null)
      markersRef.current.forEach(m => m.setMap(null))
    }
    markersRef.current = []
  }, [])

  // 마커 렌더링
  const renderMarkers = useCallback((items: MapMarkerItem[]) => {
    if (!mapInstanceRef.current) return
    clearMarkers()

    const zoomLevel  = mapInstanceRef.current.getLevel()
    const useCluster = zoomLevel >= 6 || items.length >= 100

    const newMarkers: kakao.maps.Marker[]        = []
    const newOverlays: kakao.maps.CustomOverlay[] = []

    items.forEach(item => {
      const position = new kakao.maps.LatLng(item.lat, item.lng)

      // Custom Overlay (가격 표시)
      const overlay = new kakao.maps.CustomOverlay({
        position,
        content:  markerContent(item.price),
        yAnchor:  1.1,
        zIndex:   1,
      })
      overlay.setMap(mapInstanceRef.current)
      newOverlays.push(overlay)

      // 클릭 이벤트용 투명 Marker
      const marker = new kakao.maps.Marker({
        position,
        map:     useCluster ? undefined : mapInstanceRef.current,
        visible: false,
      })
      kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClickRef.current(item)   // 최신 콜백 참조
      })
      newMarkers.push(marker)
    })

    markersRef.current  = newMarkers
    overlaysRef.current = newOverlays

    if (useCluster) {
      if (!clustererRef.current) {
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map:           mapInstanceRef.current!,
          averageCenter: true,
          minLevel:      6,
        })
      }
      clustererRef.current.addMarkers(newMarkers)
    }
  }, [clearMarkers])

  // API 호출 — throttle 500ms (fnRef 패턴으로 stale closure 방지)
  const fetchMarkersCore = async () => {
    const bounds = getBounds()
    if (!mapInstanceRef.current || !bounds) return

    const zoomLevel = mapInstanceRef.current.getLevel()
    const params    = buildParams(bounds, filtersRef.current, zoomLevel)

    try {
      const res  = await fetch(`/api/map/apartments?${params}`)
      const data = await res.json()
      if (data.success) {
        if (data.data.length === 0) {
          clearMarkers()
          // EmptyMarkerOverlay 표시는 컴포넌트에서 처리 (상태 반환)
        } else {
          renderMarkers(data.data)
        }
      }
    } catch {
      // API 실패 시 기존 마커 유지
    }
  }

  const fetchMarkers = useThrottle(fetchMarkersCore, 500)

  return {
    mapContainerRef,
    mapInstanceRef,
    fetchMarkers,
    clearMarkers,
  }
}
```

---

# 8. 파라미터 빌더

```ts
// utils/mapParamBuilder.ts
import type { MapBounds, MapFilters } from '../types/map'

export const buildParams = (
  bounds:    MapBounds,
  filters:   MapFilters,
  zoomLevel: number
): string => {
  const p = new URLSearchParams({
    minLat:    String(bounds.minLat),
    maxLat:    String(bounds.maxLat),
    minLng:    String(bounds.minLng),
    maxLng:    String(bounds.maxLng),
    zoomLevel: String(zoomLevel),
  })
  if (filters.dealType)            p.append('dealType',  filters.dealType)
  if (filters.minPrice != null)    p.append('minPrice',  String(filters.minPrice))
  if (filters.maxPrice != null)    p.append('maxPrice',  String(filters.maxPrice))
  if (filters.areaRange)           p.append('areaRange', filters.areaRange)
  return p.toString()
}
```

---

# 9. Custom Overlay 마커 스타일

```ts
// utils/mapMarkerContent.ts
import { formatPriceShort } from './format'

export const markerContent = (price: number): string => `
  <div style="
    background: white;
    border: 1.5px solid #3B82F6;
    border-radius: 12px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    color: #1e40af;
    white-space: nowrap;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  ">
    ${formatPriceShort(price)}
  </div>
`
// 예: 235000 → "23.5억"
```

---

# 10. MapView (`/map` 탭)

## 10.1 레이아웃

```
┌──────────────────────────────────────┐  Header (fixed)
├──────────────────────────────────────┤  TabBar (fixed)
│  [FilterPanel — 지도 위 absolute]    │  z-10
│                                      │
│         KakaoMap / MockMapView       │  flex-1
│   [가격마커] [가격마커] [클러스터]    │
│   [빈결과 overlay — 조건 없을 때]    │
│              [ZoomControl]           │  absolute bottom-24 right-3
│                                      │
├──────────────────────────────────────┤
│  ApartmentPanel (선택 시 슬라이드업)  │  기존 PRD 유지
└──────────────────────────────────────┘
```

## 10.2 MapView 컴포넌트

```tsx
// components/features/map/MapView.tsx

export const MapView = () => {
  // 지도탭: mapFilterStore 사용
  const filters = useMapFilterStore()

  // ⚠️ [수정] debounce를 훅 외부(MapView)에서 처리
  const debouncedFilters = useDebounce<MapFilters>({
    dealType:  filters.dealType,
    minPrice:  filters.minPrice,
    maxPrice:  filters.maxPrice,
    areaRange: filters.areaRange,
  }, 300)

  const [selectedApt, setSelectedApt] = useState<MapMarkerItem | null>(null)
  const [isEmpty, setIsEmpty]         = useState(false)

  const { mapContainerRef, mapInstanceRef, fetchMarkers, clearMarkers } = useMapMarkers({
    filters:       debouncedFilters,
    onMarkerClick: (apt) => setSelectedApt(apt),
  })

  // 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !USE_KAKAO_MAP) return

    mapInstanceRef.current = new kakao.maps.Map(mapContainerRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level:  5,
    })

    kakao.maps.event.addListener(mapInstanceRef.current, 'idle', fetchMarkers)
    fetchMarkers()
  }, [])

  // 필터 변경 → 마커 갱신
  useEffect(() => {
    if (mapInstanceRef.current) fetchMarkers()
  }, [debouncedFilters])

  if (!USE_KAKAO_MAP) return <MockMapView />

  return (
    <div className="relative flex-1 w-full overflow-hidden">
      <FilterPanel />

      <div
        ref={mapContainerRef}   // ⚠️ mapContainerRef(HTMLDivElement) 사용
        className="w-full h-full"
      />

      {isEmpty && <EmptyMarkerOverlay />}
      <ZoomControl mapInstanceRef={mapInstanceRef} />
    </div>
  )
}
```

> ⚠️ **[수정]** `useDebounce`에 객체를 전달하면 매 렌더마다 새 객체 참조가 생성되어
> debounce가 항상 초기화됨. MapFilters를 개별 값으로 debounce하거나
> `useMemo`로 filters 객체를 안정화 필요.
>
> 권장 방식:

```tsx
// 개별 값을 debounce (객체 참조 문제 회피)
const debouncedDealType  = useDebounce(filters.dealType, 300)
const debouncedMinPrice  = useDebounce(filters.minPrice, 300)
const debouncedMaxPrice  = useDebounce(filters.maxPrice, 300)
const debouncedAreaRange = useDebounce(filters.areaRange, 300)

const debouncedFilters: MapFilters = {
  dealType:  debouncedDealType,
  minPrice:  debouncedMinPrice,
  maxPrice:  debouncedMaxPrice,
  areaRange: debouncedAreaRange,
}
```

---

# 11. FilterPanel (지도 위 오버레이)

```tsx
// components/features/map/FilterPanel.tsx
// 위치: MapView 내부 absolute top-4 left-1/2 -translate-x-1/2
// z-index: z-10 (지도 레이어 위)

export const FilterPanel = () => {
  const {
    dealType, minPrice, maxPrice, areaRange,
    setDealType, setMinPrice, setMaxPrice, setAreaRange, resetFilters,
  } = useMapFilterStore()

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                    flex flex-wrap items-center justify-center gap-2
                    bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg
                    max-w-[90%]">

      {/* 거래 유형 */}
      <FilterChip label="전체" isSelected={!dealType}
        onClick={() => setDealType(null)} />
      <FilterChip label="매매" isSelected={dealType === 'SALE'}
        onClick={() => setDealType(dealType === 'SALE' ? null : 'SALE')} />
      <FilterChip label="전세" isSelected={dealType === 'JEONSE'}
        onClick={() => setDealType(dealType === 'JEONSE' ? null : 'JEONSE')} />

      <span className="text-gray-200">|</span>

      {/* 가격대 (입력 또는 preset) */}
      <FilterChip label="~10억"   isSelected={maxPrice === 100000 && !minPrice}
        onClick={() => { setMinPrice(null); setMaxPrice(maxPrice === 100000 ? null : 100000) }} />
      <FilterChip label="10~20억" isSelected={minPrice === 100000 && maxPrice === 200000}
        onClick={() => {
          if (minPrice === 100000 && maxPrice === 200000) { setMinPrice(null); setMaxPrice(null) }
          else { setMinPrice(100000); setMaxPrice(200000) }
        }} />
      <FilterChip label="20억+"   isSelected={minPrice === 200000 && !maxPrice}
        onClick={() => { setMinPrice(minPrice === 200000 ? null : 200000); setMaxPrice(null) }} />

      <span className="text-gray-200">|</span>

      {/* 면적 */}
      <FilterChip label="20평대" isSelected={areaRange === '20'}
        onClick={() => setAreaRange(areaRange === '20' ? null : '20')} />
      <FilterChip label="30평대" isSelected={areaRange === '30'}
        onClick={() => setAreaRange(areaRange === '30' ? null : '30')} />
      <FilterChip label="40평대" isSelected={areaRange === '40'}
        onClick={() => setAreaRange(areaRange === '40' ? null : '40')} />

      <button onClick={resetFilters}
        className="text-xs text-gray-400 hover:text-gray-600 ml-1">
        초기화
      </button>
    </div>
  )
}
```

---

# 12. ZoomControl (작은 커스텀 줌 버튼)

```tsx
// components/features/map/ZoomControl.tsx
// 위치: absolute bottom-24 right-3, z-10
// KakaoMap 기본 줌 UI를 사용하지 않고 커스텀 버튼으로 교체

type ZoomControlProps = {
  mapInstanceRef: React.RefObject<kakao.maps.Map | null>
}

export const ZoomControl = ({ mapInstanceRef }: ZoomControlProps) => {
  if (!USE_KAKAO_MAP) return null   // mock 모드에서 숨김

  const zoomIn  = () => {
    const map = mapInstanceRef.current
    if (map) map.setLevel(map.getLevel() - 1, { animate: true })
  }
  const zoomOut = () => {
    const map = mapInstanceRef.current
    if (map) map.setLevel(map.getLevel() + 1, { animate: true })
  }

  return (
    <div className="absolute bottom-24 right-3 z-10 flex flex-col">
      <button
        onClick={zoomIn}
        className="w-7 h-7 bg-white border border-gray-300 rounded-t-md
                   text-gray-600 text-sm font-bold shadow-sm
                   hover:bg-gray-50 active:bg-gray-100 transition-colors
                   flex items-center justify-center"
        aria-label="지도 확대"
      >
        +
      </button>
      <button
        onClick={zoomOut}
        className="w-7 h-7 bg-white border border-gray-300 border-t-0 rounded-b-md
                   text-gray-600 text-sm font-bold shadow-sm
                   hover:bg-gray-50 active:bg-gray-100 transition-colors
                   flex items-center justify-center"
        aria-label="지도 축소"
      >
        −
      </button>
    </div>
  )
}

// KakaoMap 기본 줌 컨트롤 비활성화 방법:
// map 생성 시 addControl 미호출 → 기본 UI 미표시
// map.setDraggable(true) / map.setZoomable(true) 은 그대로 유지
```

---

# 13. MapSection (아파트 선택 팝업 내부)

## 13.1 MockMapSection (KakaoMap 미연동 시)

> ⚠️ **[수정]** v2에서 `MockMapSection` 컴포넌트가 호출되지만 미명세였음.

```tsx
// components/features/apartment-select/MockMapSection.tsx

export const MockMapSection = ({
  onSelect,
}: {
  onSelect: (apt: Apartment) => void
}) => (
  <div className="relative flex-1 h-full bg-gray-100 overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-sm text-gray-400">지도 영역 (KakaoMap SDK 연동 예정)</p>
    </div>

    {/* mock 마커 버튼 */}
    {mockPopularApartments.map((apt, i) => (
      <button
        key={apt.aptId}
        onClick={() => onSelect(apt)}
        className="absolute bg-white border border-blue-400 rounded-xl
                   px-2 py-0.5 text-xs font-semibold text-blue-700 shadow-sm
                   hover:bg-blue-50 transition-colors"
        style={{
          top:  `${15 + i * 14}%`,
          left: `${10 + i * 14}%`,
        }}
      >
        {formatPriceShort(235000)}
      </button>
    ))}
  </div>
)
```

## 13.2 MapSection 컴포넌트

```tsx
// components/features/apartment-select/MapSection.tsx

export const MapSection = ({ onSelect }: { onSelect: (apt: Apartment) => void }) => {
  // 팝업 내 필터: 로컬 state (mapFilterStore 사용 안 함)
  const [dealType, setDealType] = useState<MapDealType>(null)
  const debouncedDealType = useDebounce(dealType, 300)

  const localFilters: MapFilters = {
    dealType:  debouncedDealType,
    minPrice:  null,
    maxPrice:  null,
    areaRange: null,
  }

  const { mapContainerRef, mapInstanceRef, fetchMarkers } = useMapMarkers({
    filters:       localFilters,
    onMarkerClick: (apt) => onSelect({
      aptId:   apt.aptId,
      aptName: apt.aptName,
      address: '',
      lat:     apt.lat,
      lng:     apt.lng,
    }),
  })

  useEffect(() => {
    if (mapInstanceRef.current) fetchMarkers()
  }, [debouncedDealType])

  if (!USE_KAKAO_MAP) return <MockMapSection onSelect={onSelect} />

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      {/* 팝업 내 간소화 필터 — 거래 유형만 */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                      flex gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow">
        <FilterChip label="전체" isSelected={!dealType}       onClick={() => setDealType(null)} />
        <FilterChip label="매매" isSelected={dealType === 'SALE'}   onClick={() => setDealType(dealType === 'SALE'   ? null : 'SALE')} />
        <FilterChip label="전세" isSelected={dealType === 'JEONSE'} onClick={() => setDealType(dealType === 'JEONSE' ? null : 'JEONSE')} />
      </div>

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}
```

---

# 14. MockMapView (`/map` 탭, SDK 없을 때)

```tsx
// components/features/map/MockMapView.tsx

export const MockMapView = () => {
  const { dealType } = useMapFilterStore()

  const filteredMock = mockPopularApartments.filter(() => {
    if (dealType === 'JEONSE') return false   // mock은 전부 매매로 가정
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

      {/* ZoomControl은 mock에서 숨김 (USE_KAKAO_MAP=false 시 null 반환) */}
    </div>
  )
}
```

---

# 15. 빈 결과 오버레이

```tsx
// components/features/map/EmptyMarkerOverlay.tsx

export const EmptyMarkerOverlay = () => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                  pointer-events-none">
    <div className="bg-white/90 rounded-xl px-4 py-3 shadow-md
                    text-sm text-gray-500 whitespace-nowrap">
      조건에 맞는 아파트가 없어요
    </div>
  </div>
)
```

---

# 16. 마커 클릭 처리 확정

| 진입점 | 마커 클릭 결과 |
|--------|-------------|
| `/map` 탭 | `setSelectedApt(apt)` → ApartmentPanel에 표시 |
| 팝업 MapSection | `onSelect(apt)` → userStore 업데이트 + Modal 닫기 |

> ⚠️ `navigate('/community?aptId=...')` **사용 금지** — 기존 라우팅에 없는 경로.

---

# 17. 줌 레벨 정책

## 클라이언트 렌더링 기준

| 줌 레벨 | 설명 | 마커 처리 |
|--------|------|---------|
| 1~5 | 상세~기본 | 개별 CustomOverlay + 투명 Marker |
| 6~7 | 중간 | 클러스터 |
| 8+ | 광역 | 클러스터 |

## 서버 응답 제한

| 줌 레벨 | LIMIT |
|--------|-------|
| ≤ 4 | 200 |
| 5~6 | 100 |
| ≥ 7 | 50 |

---

# 18. 가격 단위 확정

전체 PRD 만원 단위 통일.

```ts
formatPriceShort(235000)  // → "23.5억"  (마커 표시)
formatPriceShort(80000)   // → "8억"
formatPriceShort(9500)    // → "9.5천만"

// API 파라미터 (만원)
minPrice: 100000   // = 10억
maxPrice: 200000   // = 20억
```

---

# 19. API 명세 (Spring)

```
GET /api/map/apartments

Params (만원 단위):
  minLat:     number  (필수)
  maxLat:     number  (필수)
  minLng:     number  (필수)
  maxLng:     number  (필수)
  zoomLevel:  number  (필수)
  dealType?:  'SALE' | 'JEONSE'
  minPrice?:  number  (만원, 100000 = 10억)
  maxPrice?:  number  (만원, 200000 = 20억)
  areaRange?: '20' | '30' | '40'

Response 200:
{
  "success": true,
  "data": [
    { "aptId": "APT123", "aptName": "잠실엘스",
      "lat": 37.51, "lng": 127.10, "price": 235000 }
  ],
  "error": null
}

줌 레벨별 최대 반환:
  zoomLevel ≤ 4 → 200개
  zoomLevel 5~6 → 100개
  zoomLevel ≥ 7 → 50개
```

---

# 20. SQL (MyBatis, 만원 단위)

```sql
SELECT
    APT_ID,
    APT_NAME,
    LAT,
    LNG,
    PRICE
FROM APT_TABLE
WHERE LAT BETWEEN #{minLat} AND #{maxLat}
  AND LNG BETWEEN #{minLng} AND #{maxLng}

<if test="dealType != null">
  AND DEAL_TYPE = #{dealType}
</if>
<if test="minPrice != null">
  AND PRICE >= #{minPrice}
</if>
<if test="maxPrice != null">
  AND PRICE &lt;= #{maxPrice}
</if>
<if test="areaRange != null and areaRange == '20'">
  AND AREA >= 59 AND AREA &lt; 82
</if>
<if test="areaRange != null and areaRange == '30'">
  AND AREA >= 82 AND AREA &lt; 115
</if>
<if test="areaRange != null and areaRange == '40'">
  AND AREA >= 115
</if>

ORDER BY PRICE DESC
LIMIT #{limit}
```

## 인덱스

```sql
CREATE INDEX IDX_APT_LAT_LNG    ON APT_TABLE(LAT, LNG);
CREATE INDEX IDX_APT_DEAL_PRICE ON APT_TABLE(DEAL_TYPE, PRICE);
```

---

# 21. 성능 최적화

| 항목 | 적용 | 수치 |
|------|------|------|
| 지도 idle 이벤트 | `useThrottle` (fnRef 패턴) | 500ms |
| 필터 변경 | 개별 `useDebounce` (객체 참조 문제 회피) | 300ms |
| 마커 클러스터 | `MarkerClusterer` | zoom ≥ 6 또는 ≥ 100개 |
| 마커/오버레이 상태 | `useRef` (리렌더 방지) | — |
| API 응답 제한 | zoomLevel LIMIT | 50~200개 |
| 좌표 인덱스 | `IDX_APT_LAT_LNG` | LAT, LNG 복합 |

---

# 22. 컴포넌트 파일 구조

```
src/
├── components/
│   └── features/
│       ├── map/
│       │   ├── MapView.tsx                  ← /map 탭 메인
│       │   ├── FilterPanel.tsx              ← 지도 위 오버레이 필터
│       │   ├── ZoomControl.tsx              ← 작은 커스텀 줌 버튼
│       │   ├── MockMapView.tsx              ← SDK 없을 때
│       │   └── EmptyMarkerOverlay.tsx       ← 결과 없음
│       └── apartment-select/
│           ├── MapSection.tsx               ← 팝업 지도 탭
│           └── MockMapSection.tsx           ← 팝업 mock 지도
├── hooks/
│   └── useMapMarkers.ts                     ← 공용 마커 로직
├── stores/
│   └── mapFilterStore.ts                    ← /map 탭 필터
├── utils/
│   ├── mapParamBuilder.ts                   ← URLSearchParams 빌더
│   └── mapMarkerContent.ts                  ← CustomOverlay HTML
├── config/
│   └── featureFlags.ts                      ← USE_KAKAO_MAP 단일 관리
└── types/
    └── map.ts
```

---

# 23. 최종 생성 요구사항

1. **`featureFlags.ts` 단일 파일** — `USE_KAKAO_MAP` 한 곳에서 관리
2. **`mapContainerRef` / `mapInstanceRef` 분리** — DOM ref와 지도 인스턴스 ref 타입 분리
3. **`overlaysRef` 별도 관리** — CustomOverlay는 markersRef가 아닌 overlaysRef로 관리
4. **clearMarkers 분기** — 클러스터 사용 중: `clustererRef.clear()` / 미사용: `setMap(null)` 루프 (중복 불가)
5. **필터 debounce 위치** — `useMapMarkers` 훅 외부(컴포넌트)에서 처리
6. **개별 debounce** — 객체 참조 문제 방지를 위해 `dealType`, `minPrice`, `maxPrice`, `areaRange` 개별 debounce
7. **stale closure 방지** — `filtersRef`, `onMarkerClickRef`로 최신값 참조
8. **`MockMapSection` 명세** — 팝업 mock 지도, 아파트 검색 팝업 v3 `onSelect` 시그니처 준수
9. **ZoomControl** — `w-7 h-7`, `{ animate: true }`, KakaoMap 기본 UI 미사용
10. **FilterPanel** — absolute 오버레이, 거래유형·가격대·면적 토글 chip
11. **팝업 MapSection** — 로컬 dealType만, mapFilterStore 사용 안 함
12. **마커 클릭** — 지도탭: `setSelectedApt()` / 팝업: `onSelect()`, navigate 사용 금지
13. **가격 단위 만원** — API 요청·응답·mock 모두 만원, `formatPriceShort()` 재사용
14. **SQL areaRange** — ㎡ 기준 (59~82 / 82~115 / 115+)
15. **인덱스** — `IDX_APT_LAT_LNG` 필수
16. **빈 결과** — `clearMarkers()` + `EmptyMarkerOverlay` 표시
