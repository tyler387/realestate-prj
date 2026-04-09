import { mockApartments } from '../../../data/mockData'
import { ApartmentListItem } from './ApartmentListItem'
import { EmptyState } from '../../common/EmptyState'

export const ApartmentList = ({ query }: { query: string }) => {
  const filtered = mockApartments.filter(
    (a) => a.name.includes(query) || a.address.includes(query)
  )

  if (filtered.length === 0) return <EmptyState message="검색 결과가 없습니다" />

  return (
    <div>
      {filtered.map((apt) => (
        <ApartmentListItem key={apt.id} apartment={apt} />
      ))}
    </div>
  )
}
