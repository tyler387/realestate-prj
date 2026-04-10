import { type Apartment } from '../../../data/mockTradeData'
import { formatPrice } from '../../../utils/formatPrice'

type Props = {
  apartment: Apartment
  latestPrice: number
  priceChangeRate: number
  isFavorite: boolean
  onFavoriteToggle: () => void
}

export const ApartmentHeader = ({ apartment, latestPrice, priceChangeRate, isFavorite, onFavoriteToggle }: Props) => (
  <div className="relative bg-white px-4 py-5">
    <p className="text-xl font-bold text-gray-900">{apartment.apartmentName}</p>
    <p className="mt-1 text-sm text-gray-500">{apartment.address}</p>
    <p className="mt-3 text-2xl font-bold text-gray-900">{formatPrice(latestPrice)}</p>
    <p className={`mt-1 text-sm ${priceChangeRate > 0 ? 'text-red-500' : priceChangeRate < 0 ? 'text-blue-400' : 'text-gray-400'}`}>
      {priceChangeRate > 0
        ? `+${priceChangeRate.toFixed(1)}% 전월 대비`
        : priceChangeRate < 0
          ? `-${Math.abs(priceChangeRate).toFixed(1)}% 전월 대비`
          : '전월 대비 변동 없음'}
    </p>
    <button className="absolute right-4 top-5 flex items-center gap-1 text-sm" onClick={onFavoriteToggle}>
      <span className={isFavorite ? 'text-yellow-400' : 'text-gray-400'}>{isFavorite ? '★' : '☆'}</span>
      <span className="text-gray-500">관심</span>
    </button>
  </div>
)
