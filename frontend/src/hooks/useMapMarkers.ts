import { useRef, useCallback, useEffect } from 'react'
import { useThrottle }        from './useThrottle'
import { markerContent }      from '../utils/mapMarkerContent'
import { buildParams }        from '../utils/mapParamBuilder'
import type { MapMarkerItem, MapViewBounds, MapFilters } from '../types/map'

type UseMapMarkersParams = {
  filters:       MapFilters
  onMarkerClick: (apt: MapMarkerItem) => void
}

export const useMapMarkers = ({ filters, onMarkerClick }: UseMapMarkersParams) => {
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

  // 마커 렌더링 (CustomOverlay + 투명 클릭 Marker)
  const renderMarkers = useCallback((items: MapMarkerItem[]) => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return
    clearMarkers()

    const zoomLevel  = mapInstanceRef.current.getLevel()
    const useCluster = zoomLevel >= 6 || items.length >= 100

    const newMarkers:  any[] = []
    const newOverlays: any[] = []

    items.forEach(item => {
      const position = new window.kakao.maps.LatLng(item.lat, item.lng)

      // 가격 표시 CustomOverlay
      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content: markerContent(item.price),
        yAnchor: 1.1,
        zIndex:  1,
      })
      overlay.setMap(mapInstanceRef.current)
      newOverlays.push(overlay)

      // 클릭 이벤트용 투명 Marker
      const marker = new window.kakao.maps.Marker({
        position,
        map:     useCluster ? undefined : mapInstanceRef.current,
        visible: false,
      })
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClickRef.current(item)
      })
      newMarkers.push(marker)
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
  }, [clearMarkers])

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
      }> = await res.json()

      if (data.length === 0) {
        clearMarkers()
      } else {
        renderMarkers(
          data.map((d) => ({
            aptId:   String(d.id),
            aptName: d.complexName,
            lat:     d.latitude,
            lng:     d.longitude,
            price:   d.latestSalePrice ?? 0,
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
