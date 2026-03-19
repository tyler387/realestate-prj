import { useMemo, useState } from 'react'

type SearchBarProps = {
  map: any | null
}

type SearchPlace = {
  id: string
  place_name: string
  road_address_name?: string
  address_name: string
  x: string
  y: string
}

export const SearchBar = ({ map }: SearchBarProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchPlace[]>([])

  const places = useMemo(() => {
    // 지도와 services 라이브러리가 준비된 이후에만 장소 검색 객체를 생성한다.
    if (!map || !window.kakao?.maps?.services) {
      return null
    }

    return new window.kakao.maps.services.Places()
  }, [map])

  const searchPlaces = () => {
    const keyword = query.trim()

    // 빈 검색어/SDK 미준비 상태에서는 검색 요청을 보내지 않는다.
    if (!keyword || !places || !window.kakao?.maps?.services) {
      return
    }

    places.keywordSearch(keyword, (data: SearchPlace[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK) {
        // 드롭다운은 최대 5개까지만 표시한다.
        setResults(data.slice(0, 5))
        return
      }

      setResults([])
    })
  }

  const handleSelectPlace = (place: SearchPlace) => {
    if (!map || !window.kakao?.maps) {
      return
    }

    // Kakao Places 좌표는 문자열(x:경도, y:위도)이라 숫자로 변환 후 사용한다.
    const lat = Number(place.y)
    const lng = Number(place.x)

    map.setLevel(4)
    map.setCenter(new window.kakao.maps.LatLng(lat, lng))
    setQuery(place.place_name)
    setResults([])
  }

  return (
    <div className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 shadow-sm">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                searchPlaces()
              }
            }}
            placeholder="지역, 지하철역, 주소를 검색하세요"
            className="h-10 w-full rounded-md px-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={searchPlaces}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white transition hover:bg-slate-700"
            aria-label="검색"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {results.length > 0 && (
          <ul className="absolute left-0 right-0 top-[calc(100%+0.5rem)] max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => handleSelectPlace(result)}
                  className="w-full px-4 py-3 text-left transition hover:bg-slate-100"
                >
                  <p className="text-sm font-medium text-slate-900">{result.place_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{result.road_address_name || result.address_name}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
