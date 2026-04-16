import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecentSearchList } from '../components/features/trade/RecentSearchList'
import { ApartmentSearchItem } from '../components/features/trade/ApartmentSearchItem'
import { EmptyState } from '../components/common/EmptyState'
import { useDebounce } from '../hooks/useDebounce'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'
const STORAGE_KEY = 'recentTradeSearch'

type ApartmentResult = {
  id: number
  complexName: string
  roadAddress: string
  sigungu: string
  eupMyeonDong: string
  latitude: number
  longitude: number
}

const loadRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

const saveRecent = (items: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const TradeSearchPage = () => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApartmentResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }
    setIsLoading(true)
    fetch(`${API_BASE_URL}/api/v1/apartments/search?keyword=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data: ApartmentResult[]) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false))
  }, [debouncedQuery])

  const addRecent = (term: string) => {
    const next = [term, ...recentSearches.filter((t) => t !== term)].slice(0, 5)
    setRecentSearches(next)
    saveRecent(next)
  }

  const removeRecent = (term: string) => {
    const next = recentSearches.filter((t) => t !== term)
    setRecentSearches(next)
    saveRecent(next)
  }

  const clearAll = () => {
    setRecentSearches([])
    saveRecent([])
  }

  const handleSelect = (apt: ApartmentResult) => {
    addRecent(apt.complexName)
    navigate(`/trade/apartment/${apt.id}`, { state: { apartmentName: apt.complexName } })
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 bg-white px-4 py-2">
        <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            placeholder="아파트명으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {query === '' && (
        <RecentSearchList
          items={recentSearches}
          onSelect={(term) => setQuery(term)}
          onRemove={removeRecent}
          onClearAll={clearAll}
        />
      )}

      {query !== '' && isLoading && (
        <p className="px-4 py-4 text-sm text-gray-400">검색 중...</p>
      )}

      {query !== '' && !isLoading && results.length > 0 && (
        <div>
          <p className="px-4 py-2 text-xs text-gray-400">검색 결과 {results.length}개</p>
          {results.map((apt) => (
            <ApartmentSearchItem
              key={apt.id}
              apartment={{ apartmentId: apt.id, apartmentName: apt.complexName, address: apt.roadAddress ?? `${apt.sigungu} ${apt.eupMyeonDong}`, latestPrice: 0 }}
              onSelect={() => handleSelect(apt)}
            />
          ))}
        </div>
      )}

      {query !== '' && !isLoading && results.length === 0 && (
        <EmptyState icon="🔍" title="검색 결과가 없어요" />
      )}
    </div>
  )
}
