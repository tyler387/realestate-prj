import { useState } from 'react'
import { ApartmentList } from '../components/features/verify/ApartmentList'

export const VerifyPage = () => {
  const [query, setQuery] = useState('')

  return (
    <div className="flex flex-col pb-6">
      <div className="sticky top-0 z-10 bg-white px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="아파트명 또는 주소 검색"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>
      <ApartmentList query={query} />
    </div>
  )
}
