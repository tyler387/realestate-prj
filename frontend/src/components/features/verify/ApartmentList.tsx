import { useEffect, useState } from 'react'
import { ApartmentListItem } from './ApartmentListItem'
import { EmptyState } from '../../common/EmptyState'
import { useDebounce } from '../../../hooks/useDebounce'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

type ApartmentItem = { id: number; name: string; address: string }

type Props = {
  query: string
  onVerify: (apartment: { id: number; name: string }) => void
}

export const ApartmentList = ({ query, onVerify }: Props) => {
  const [results, setResults] = useState<ApartmentItem[]>([])
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }
    fetch(`${API_BASE_URL}/api/v1/apartments/search?keyword=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: Array<{ id: number; complexName: string; roadAddress: string }>) =>
        setResults(data.map((d) => ({ id: d.id, name: d.complexName, address: d.roadAddress ?? '' })))
      )
      .catch(() => setResults([]))
  }, [debouncedQuery])

  if (!query.trim()) return null
  if (results.length === 0) return <EmptyState message="검색 결과가 없습니다" />

  return (
    <div>
      {results.map((apartment) => (
        <ApartmentListItem key={apartment.id} apartment={apartment} onVerify={onVerify} />
      ))}
    </div>
  )
}
