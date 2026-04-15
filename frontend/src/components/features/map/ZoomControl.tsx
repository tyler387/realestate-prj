import type { RefObject } from 'react'
import { USE_KAKAO_MAP } from '../../../config/featureFlags'

type ZoomControlProps = {
  mapInstanceRef: RefObject<any>
}

export const ZoomControl = ({ mapInstanceRef }: ZoomControlProps) => {
  if (!USE_KAKAO_MAP) return null

  const zoomIn = () => {
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
        aria-label="지도 확대"
        className="w-7 h-7 bg-white border border-gray-300 rounded-t-md
                   text-gray-600 text-sm font-bold shadow-sm
                   hover:bg-gray-50 active:bg-gray-100 transition-colors
                   flex items-center justify-center"
      >
        +
      </button>
      <button
        onClick={zoomOut}
        aria-label="지도 축소"
        className="w-7 h-7 bg-white border border-gray-300 border-t-0 rounded-b-md
                   text-gray-600 text-sm font-bold shadow-sm
                   hover:bg-gray-50 active:bg-gray-100 transition-colors
                   flex items-center justify-center"
      >
        −
      </button>
    </div>
  )
}
