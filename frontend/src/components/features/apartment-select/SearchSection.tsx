import { useState, useEffect } from 'react'
import type { Apartment } from '../../../types'
import { useDebounce } from '../../../hooks/useDebounce'
import { EmptyState } from '../../common/EmptyState'
import { Skeleton } from '../../common/Skeleton'
import {
  USE_MOCK_SEARCH,
  searchApartmentsMock,
  mockPopularApartments,
} from '../../../data/mockApartmentData'
import {
  getRecentApartments,
  clearRecentApartments,
  saveRecentApartment,
} from '../../../utils/recentApartments'

// ── SearchInput ────────────────────────────────────────────────────
const SearchInput = ({
  value,
  onChange,
  onClear,
}: {
  value: string
  onChange: (v: string) => void
  onClear: () => void
}) => (
  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
    <span className="text-gray-400 text-sm flex-shrink-0">🔍</span>
    <input
      type="text"
      autoFocus
      autoComplete="off"
      placeholder="아파트명 또는 지역으로 검색"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
    />
    {value && (
      <button onClick={onClear} className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0">
        ✕
      </button>
    )}
  </div>
)

// ── SearchResultItem ───────────────────────────────────────────────
const SearchResultItem = ({
  apt,
  onSelect,
}: {
  apt: Apartment
  onSelect: (apt: Apartment) => void
}) => (
  <div
    onClick={() => onSelect(apt)}
    className="flex items-center justify-between
               px-4 py-3 border-b border-gray-100 last:border-b-0
               cursor-pointer hover:bg-gray-50 transition-colors"
  >
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate">{apt.aptName}</p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{apt.address}</p>
    </div>
    <span className="text-gray-300 text-sm flex-shrink-0 ml-2">›</span>
  </div>
)

// ── SearchResultSkeleton ───────────────────────────────────────────
const SearchResultSkeleton = () => (
  <div className="px-4 py-2 space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-1.5">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    ))}
  </div>
)

// ── RecentApartmentList ────────────────────────────────────────────
const RecentApartmentList = ({
  onSelect,
}: {
  onSelect: (apt: Apartment) => void
}) => {
  const [recents, setRecents] = useState<Apartment[]>([])

  useEffect(() => {
    setRecents(getRecentApartments())
  }, [])

  if (recents.length === 0) return null

  return (
    <div className="py-3">
      <div className="flex items-center justify-between px-4 mb-1">
        <span className="text-xs font-medium text-gray-500">최근 선택</span>
        <button
          onClick={() => {
            clearRecentApartments()
            setRecents([])
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          전체삭제
        </button>
      </div>
      {recents.map(apt => (
        <SearchResultItem key={apt.aptId} apt={apt} onSelect={onSelect} />
      ))}
    </div>
  )
}

// ── PopularApartmentList ───────────────────────────────────────────
const PopularApartmentList = ({
  onSelect,
}: {
  onSelect: (apt: Apartment) => void
}) => {
  const data = mockPopularApartments

  if (!data || data.length === 0) return null

  return (
    <div className="py-3">
      <p className="text-xs font-medium text-gray-500 px-4 mb-1">인기 아파트</p>
      {data.map((apt, i) => (
        <div
          key={apt.aptId}
          onClick={() => onSelect(apt)}
          className="flex items-center gap-3 px-4 py-3
                     border-b border-gray-100 last:border-b-0
                     cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <span className={`w-5 text-xs font-bold flex-shrink-0 text-center
            ${i < 3 ? 'text-blue-500' : 'text-gray-400'}`}>
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{apt.aptName}</p>
            <p className="text-xs text-gray-400 truncate">{apt.address}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── SearchSection ──────────────────────────────────────────────────
export const SearchSection = ({
  onSelect,
}: {
  onSelect: (apt: Apartment) => void
}) => {
  const [keyword, setKeyword]   = useState('')
  const [results, setResults]   = useState<Apartment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError]   = useState(false)

  const debouncedKeyword = useDebounce(keyword, 300)

  useEffect(() => {
    if (debouncedKeyword.length < 2) {
      setResults([])
      setIsError(false)
      return
    }
    fetchSearch(debouncedKeyword)
  }, [debouncedKeyword])

  const fetchSearch = async (kw: string) => {
    setIsLoading(true)
    setIsError(false)
    try {
      if (USE_MOCK_SEARCH) {
        await new Promise(r => setTimeout(r, 200))
        setResults(searchApartmentsMock(kw))
      } else {
        const res  = await fetch(`/api/apartments/search?keyword=${encodeURIComponent(kw)}`)
        const data = await res.json()
        if (data.success) setResults(data.data)
        else throw new Error(data.error?.message)
      }
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (apt: Apartment) => {
    saveRecentApartment(apt)
    onSelect(apt)
  }

  const renderContent = () => {
    if (keyword.length === 0) return (
      <>
        <RecentApartmentList onSelect={handleSelect} />
        <PopularApartmentList onSelect={handleSelect} />
      </>
    )

    if (keyword.length < 2) return (
      <p className="text-xs text-gray-400 text-center py-8">
        2글자 이상 입력해주세요
      </p>
    )

    if (isLoading) return <SearchResultSkeleton />

    if (isError) return (
      <p className="text-xs text-red-400 text-center py-8">
        잠시 후 다시 시도해주세요
      </p>
    )

    if (results.length === 0) return (
      <EmptyState icon="🔍" title="검색 결과가 없습니다" />
    )

    return (
      <div>
        {results.map(apt => (
          <SearchResultItem key={apt.aptId} apt={apt} onSelect={handleSelect} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <SearchInput
        value={keyword}
        onChange={setKeyword}
        onClear={() => setKeyword('')}
      />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
