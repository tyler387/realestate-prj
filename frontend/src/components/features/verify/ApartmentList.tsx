import { mockApartments } from '../../../data/mockData'
import { ApartmentListItem } from './ApartmentListItem'
import { EmptyState } from '../../common/EmptyState'

type Props = {
  query: string
  onVerify: (apartment: { id: number; name: string }) => void
}

export const ApartmentList = ({ query, onVerify }: Props) => {
  const filtered = mockApartments.filter((apartment) => apartment.name.includes(query) || apartment.address.includes(query))

  if (filtered.length === 0) return <EmptyState message="검색 결과가 없습니다" />

  return (
    <div>
      {filtered.map((apartment) => (
        <ApartmentListItem key={apartment.id} apartment={apartment} onVerify={onVerify} />
      ))}
    </div>
  )
}
