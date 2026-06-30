import { useRef, useCallback, useEffect } from 'react'
import { useThrottle }        from './useThrottle'
import { groupMarkerContent, markerContent, popupMarkerContent } from '../utils/mapMarkerContent'
import { buildParams }        from '../utils/mapParamBuilder'
import type { MapMarkerItem, MapViewBounds, MapFilters } from '../types/map'

type UseMapMarkersParams = {
  filters:       MapFilters
  onMarkerClick: (apt: MapMarkerItem) => void
  showPriceOverlay?: boolean
  groupByRegion?: boolean
}

export const useMapMarkers = ({
  filters,
  onMarkerClick,
  showPriceOverlay = true,
  groupByRegion = false,
}: UseMapMarkersParams) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef  = useRef<any | null>(null)
  const markersRef      = useRef<any[]>([])
  const overlaysRef     = useRef<any[]>([])
  const clustererRef    = useRef<any | null>(null)

  // stale closure 방지 — 항상 최신값 유지
  const filtersRef       = useRef<MapFilters>(filters)
  const onMarkerClickRef = useRef(onMarkerClick)

  useEffect(() => { filtersRef.current       = filters       }, [filters])
  useEffect(() => { onMarkerClickRef.current = onMarkerClick }, [onMarkerClick])

  const getBounds = (): MapViewBounds | null => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return null
    const bounds = mapInstanceRef.current.getBounds()
    return {
      minLat: bounds.getSouthWest().getLat(),
      maxLat: bounds.getNorthEast().getLat(),
      minLng: bounds.getSouthWest().getLng(),
      maxLng: bounds.getNorthEast().getLng(),
    }
  }

  // 마커 + 오버레이 전체 제거 (클러스터 여부에 따라 경로 분리)
  const clearMarkers = useCallback(() => {
    overlaysRef.current.forEach(ov => ov.setMap(null))
    overlaysRef.current = []

    if (clustererRef.current) {
      clustererRef.current.clear()
    } else {
      markersRef.current.forEach(m => m.setMap(null))
    }
    markersRef.current = []
  }, [])

  const toOverlayElement = (html: string, onClick: (event: Event) => void) => {
    const overlayRoot = document.createElement('div')
    overlayRoot.innerHTML = html.trim()
    const overlayContent = overlayRoot.firstElementChild as HTMLElement | null
    const clickableContent = overlayContent ?? overlayRoot
    clickableContent.addEventListener('click', onClick)
    clickableContent.addEventListener('mousedown', (event) => event.stopPropagation())
    clickableContent.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true })
    return clickableContent
  }

  const gridKey = (item: MapMarkerItem, zoomLevel: number): string => {
    const scale = zoomLevel >= 6 ? 20 : 45
    return `${Math.round(item.lat * scale)}:${Math.round(item.lng * scale)}`
  }

  const groupKey = (item: MapMarkerItem, zoomLevel: number): string => {
    if (zoomLevel >= 6) return item.sigungu || item.eupMyeonDong || gridKey(item, zoomLevel)
    return item.eupMyeonDong || item.sigungu || gridKey(item, zoomLevel)
  }

  const groupLabel = (items: MapMarkerItem[], zoomLevel: number): string => {
    const representative = items[0]
    if (zoomLevel >= 6) return representative.sigungu || representative.eupMyeonDong || '이 지역'
    return representative.eupMyeonDong || representative.sigungu || '이 지역'
  }

  const groupMarkers = (items: MapMarkerItem[], zoomLevel: number) => {
    const groups = new Map<string, MapMarkerItem[]>()
    items.forEach((item) => {
      const key = groupKey(item, zoomLevel)
      groups.set(key, [...(groups.get(key) ?? []), item])
    })
    return [...groups.entries()].map(([, groupItems]) => {
      const lat = groupItems.reduce((sum, item) => sum + item.lat, 0) / groupItems.length
      const lng = groupItems.reduce((sum, item) => sum + item.lng, 0) / groupItems.length
      return { label: groupLabel(groupItems, zoomLevel), items: groupItems, lat, lng }
    })
  }

  // 마커 렌더링. 메인 지도는 가격 라벨, 팝업 지도는 작은 가격 마커와 지역 묶음을 사용한다.
  const renderMarkers = useCallback((items: MapMarkerItem[]) => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return
    clearMarkers()

    const zoomLevel  = mapInstanceRef.current.getLevel()
    const useCluster = zoomLevel >= 6 || items.length >= 100
    const useRegionGroups = groupByRegion && (zoomLevel >= 6 || (zoomLevel >= 5 && items.length >= 100))

    const newMarkers:  any[] = []
    const newOverlays: any[] = []

    const renderItemMarker = (item: MapMarkerItem) => {
      const position = new window.kakao.maps.LatLng(item.lat, item.lng)
      const content = showPriceOverlay
        ? markerContent(item.price, item.tradeType)
        : popupMarkerContent(item.aptName, item.price, item.tradeType)
      const clickableContent = toOverlayElement(content, (event) => {
        event.stopPropagation()
        onMarkerClickRef.current(item)
      })

      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content: clickableContent,
        yAnchor: showPriceOverlay ? 1.1 : 1.15,
        zIndex: 1,
      })
      overlay.setMap(mapInstanceRef.current)
      newOverlays.push(overlay)

      const marker = new window.kakao.maps.Marker({
        position,
        map: useCluster ? undefined : mapInstanceRef.current,
        visible: false,
      })
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClickRef.current(item)
      })
      newMarkers.push(marker)
    }

    if (useRegionGroups) {
      groupMarkers(items, zoomLevel).forEach((group) => {
        if (group.items.length === 1 && zoomLevel <= 5) {
          renderItemMarker(group.items[0])
          return
        }
        const position = new window.kakao.maps.LatLng(group.lat, group.lng)
        const content = toOverlayElement(groupMarkerContent(group.label, group.items.length), (event) => {
          event.stopPropagation()
          mapInstanceRef.current?.setCenter(position)
          mapInstanceRef.current?.setLevel(Math.max(3, zoomLevel - 2))
        })
        const overlay = new window.kakao.maps.CustomOverlay({
          position,
          content,
          yAnchor: 0.9,
          zIndex: 2,
        })
        overlay.setMap(mapInstanceRef.current)
        newOverlays.push(overlay)
      })
      markersRef.current = newMarkers
      overlaysRef.current = newOverlays
      return
    }

    items.forEach(item => {
      renderItemMarker(item)
    })

    markersRef.current  = newMarkers
    overlaysRef.current = newOverlays

    if (useCluster) {
      if (!clustererRef.current) {
        clustererRef.current = new window.kakao.maps.MarkerClusterer({
          map:           mapInstanceRef.current,
          averageCenter: true,
          minLevel:      6,
        })
      }
      clustererRef.current.addMarkers(newMarkers)
    }
  }, [clearMarkers, groupByRegion, showPriceOverlay])

  // API 호출 (throttle 500ms + fnRef로 stale closure 방지)
  const fetchMarkersCore = async () => {
    const bounds = getBounds()
    if (!mapInstanceRef.current || !bounds) return

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'
    const zoomLevel = mapInstanceRef.current.getLevel()
    const params    = buildParams(bounds, filtersRef.current, zoomLevel)

    try {
      const res  = await fetch(`${API_BASE_URL}/api/v1/apartments/markers?${params}`)
      if (!res.ok) return
      const data: Array<{
        id: number
        complexName: string
        eupMyeonDong: string
        latitude: number
        longitude: number
        latestSalePrice: number | null
        latestSaleArea: number | null
        latestTradeDate: string | null
        latestTradeType: string | null
        sigungu?: string | null
      }> = await res.json()

      if (data.length === 0) {
        clearMarkers()
      } else {
        renderMarkers(
          data.map((d) => ({
            aptId:   String(d.id),
            aptName: d.complexName,
            sigungu: d.sigungu ?? undefined,
            eupMyeonDong: d.eupMyeonDong,
            lat:     d.latitude,
            lng:     d.longitude,
            price:   d.latestSalePrice ?? 0,
            area:    d.latestSaleArea,
            tradeDate: d.latestTradeDate,
            tradeType: d.latestTradeType,
          }))
        )
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
    renderMarkers,
  }
}
