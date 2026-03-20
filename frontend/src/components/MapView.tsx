import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { apartmentApi } from '../api/apartmentApi'
import type { ApartmentMarker, MapBounds } from '../types/apartment'
import { formatPrice } from '../utils/formatPrice'

type MapViewProps = {
  onMapReady: (map: any | null) => void
}

export const MapView = ({ onMapReady }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any | null>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowsRef = useRef<any[]>([])
  const openedInfoWindowRef = useRef<any | null>(null)
  const idleTimerRef = useRef<number | null>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const kakaoMapKey = (import.meta.env.VITE_KAKAO_MAP_KEY ?? '').trim()
  const isPlaceholderKey =
    !kakaoMapKey ||
    kakaoMapKey === 'YOUR_APP_KEY' ||
    kakaoMapKey === 'YOUR_JAVASCRIPT_KEY'

  const { data: apartments = [], isFetching } = useQuery({
    queryKey: ['markers', bounds],
    queryFn: () => apartmentApi.getMarkers(bounds as MapBounds),
    staleTime: 60000,
    enabled: bounds !== null,
  })

  useEffect(() => {
    const container = mapContainerRef.current
    let isMounted = true

    if (!container) {
      return
    }

    if (isPlaceholderKey) {
      setLoadError('카카오 지도 키가 설정되지 않았습니다. frontend/.env 의 VITE_KAKAO_MAP_KEY 값을 확인하세요.')
      return
    }

    const loadKakaoMapSdk = async () => {
      if (window.kakao?.maps?.load) {
        return
      }

      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-maps-sdk="true"]')
        if (existing) {
          if (existing.dataset.loaded === 'true') {
            resolve()
            return
          }
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('SDK load failed')), { once: true })
          return
        }

        const script = document.createElement('script')
        script.dataset.kakaoMapsSdk = 'true'
        script.async = true
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=services`
        script.onload = () => {
          script.dataset.loaded = 'true'
          resolve()
        }
        script.onerror = () => reject(new Error('SDK load failed'))
        document.head.appendChild(script)
      })
    }

    const updateBounds = (map: any) => {
      const mapBounds = map.getBounds()
      const sw = mapBounds.getSouthWest()
      const ne = mapBounds.getNorthEast()

      setBounds({
        swLng: sw.getLng(),
        swLat: sw.getLat(),
        neLng: ne.getLng(),
        neLat: ne.getLat(),
      })
    }

    loadKakaoMapSdk()
      .then(() => {
        if (!isMounted || !window.kakao?.maps?.load) {
          return
        }

        window.kakao.maps.load(() => {
          if (!isMounted || !window.kakao?.maps) {
            return
          }

          setLoadError(null)
          const center = new window.kakao.maps.LatLng(37.5665, 126.978)
          const map = new window.kakao.maps.Map(container, {
            center,
            level: 7,
          })

          mapRef.current = map
          onMapReady(map)
          updateBounds(map)

          window.kakao.maps.event.addListener(map, 'idle', () => {
            if (idleTimerRef.current) {
              window.clearTimeout(idleTimerRef.current)
            }

            idleTimerRef.current = window.setTimeout(() => {
              updateBounds(map)
            }, 400)
          })

          window.kakao.maps.event.addListener(map, 'click', () => {
            if (openedInfoWindowRef.current) {
              openedInfoWindowRef.current.close()
              openedInfoWindowRef.current = null
            }
          })
        })
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(`카카오 지도 SDK를 불러오지 못했습니다. 현재 origin: ${window.location.origin}`)
        }
      })

    return () => {
      isMounted = false
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
      }
      onMapReady(null)
    }
  }, [isPlaceholderKey, kakaoMapKey, onMapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.kakao?.maps) {
      return
    }

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
    infoWindowsRef.current = []
    openedInfoWindowRef.current = null

    apartments.forEach((apartment: ApartmentMarker) => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(apartment.latitude, apartment.longitude),
      })

      const priceText =
        apartment.latestSalePrice === null ? '최근 매매가 정보 없음' : `최근 매매가 ${formatPrice(apartment.latestSalePrice)}`

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding:8px 10px; font-size:12px; line-height:1.4; white-space:nowrap;">
            <div style="font-weight:700; margin-bottom:2px;">${apartment.complexName}</div>
            <div>${priceText}</div>
          </div>
        `,
      })

      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (openedInfoWindowRef.current) {
          openedInfoWindowRef.current.close()
        }
        infoWindow.open(map, marker)
        openedInfoWindowRef.current = infoWindow
      })

      markersRef.current.push(marker)
      infoWindowsRef.current.push(infoWindow)
    })
  }, [apartments])

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-700">
        {loadError}
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {isFetching && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md bg-white/90 px-3 py-1 text-xs shadow">
          데이터 불러오는 중...
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  )
}
