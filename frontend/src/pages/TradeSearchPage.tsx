import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecentSearchList } from '../components/features/trade/RecentSearchList'
import { ApartmentSearchItem } from '../components/features/trade/ApartmentSearchItem'
import { EmptyState } from '../components/common/EmptyState'
import { mockApartments, type Apartment } from '../data/mockTradeData'

const STORAGE_KEY = 'recentTradeSearch'

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
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results: Apartment[] = query
    ? mockApartments.filter((a) =>
        a.apartmentName.includes(query) || a.address.includes(query)
      )
    : []

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

  const handleSelect = (apartment: Apartment) => {
    addRecent(apartment.apartmentName)
    navigate(`/trade/apartment/${apartment.apartmentId}`, { state: { apartmentName: apartment.apartmentName } })
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

      {query !== '' && results.length > 0 && (
        <div>
          <p className="px-4 py-2 text-xs text-gray-400">검색 결과 {results.length}개</p>
          {results.map((a) => (
            <ApartmentSearchItem key={a.apartmentId} apartment={a} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {query !== '' && results.length === 0 && (
        <EmptyState icon="🔍" title="검색 결과가 없어요" />
      )}
    </div>
  )
}
