import { type Apartment } from '../../../data/mockTradeData'
import { formatPrice } from '../../../utils/formatPrice'

type Props = {
  apartment: Apartment
  onSelect: (apartment: Apartment) => void
}

export const ApartmentSearchItem = ({ apartment, onSelect }: Props) => (
  <div
    className="flex cursor-pointer items-center border-b border-gray-100 px-4 py-3"
    onClick={() => onSelect(apartment)}
  >
    <div className="flex-1">
      <p className="font-semibold text-gray-900">{apartment.apartmentName}</p>
      <p className="mt-0.5 text-xs text-gray-400">{apartment.address}</p>
      <p className="mt-1 text-sm text-blue-500">{formatPrice(apartment.latestPrice)}</p>
    </div>
    <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
)
