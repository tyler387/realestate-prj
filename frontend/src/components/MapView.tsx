import { useEffect, useRef, useState } from 'react'
import type { Apartment } from '../types/apartment'
import { formatPrice } from '../utils/formatPrice'

type MapViewProps = {
  apartments: Apartment[]
  onMapReady: (map: any | null) => void
}

export const MapView = ({ apartments, onMapReady }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const kakaoMapKey = (import.meta.env.VITE_KAKAO_MAP_KEY ?? '').trim()
  const isPlaceholderKey =
    !kakaoMapKey ||
    kakaoMapKey === 'YOUR_APP_KEY' ||
    kakaoMapKey === 'YOUR_JAVASCRIPT_KEY'

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

          onMapReady(map)

          let openedInfoWindow: any = null

          apartments.forEach((apartment) => {
            const marker = new window.kakao.maps.Marker({
              map,
              position: new window.kakao.maps.LatLng(apartment.latitude, apartment.longitude),
            })

            const infoWindow = new window.kakao.maps.InfoWindow({
              content: `
                <div style="padding:8px 10px; font-size:12px; line-height:1.4; white-space:nowrap;">
                  <div style="font-weight:700; margin-bottom:2px;">${apartment.complexName}</div>
                  <div>${formatPrice(apartment.latestSalePrice)}</div>
                </div>
              `,
            })

            window.kakao.maps.event.addListener(marker, 'click', () => {
              if (openedInfoWindow) {
                openedInfoWindow.close()
              }

              infoWindow.open(map, marker)
              openedInfoWindow = infoWindow
            })
          })

          window.kakao.maps.event.addListener(map, 'click', () => {
            if (openedInfoWindow) {
              openedInfoWindow.close()
              openedInfoWindow = null
            }
          })
        })
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('카카오 지도 SDK를 불러오지 못했습니다. 키/도메인 등록 상태를 확인하세요.')
        }
      })

    return () => {
      isMounted = false
      onMapReady(null)
    }
  }, [apartments, isPlaceholderKey, kakaoMapKey, onMapReady])

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-700">
        {loadError}
      </div>
    )
  }

  return <div ref={mapContainerRef} className="h-full w-full" />
}

