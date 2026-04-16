import { type HighestPriceDeal } from '../../../types/sidebar'
import { formatPrice } from '../../../utils/formatPrice'

type Props = {
  deal: HighestPriceDeal
  onClick: () => void
}

export const HighestDealItem = ({ deal, onClick }: Props) => (
  <div
    onClick={onClick}
    className="-mx-1 cursor-pointer rounded border-b border-gray-100 px-1 py-2 transition-colors last:border-b-0 hover:bg-gray-50"
  >
    <div className="mb-0.5 flex items-center gap-1.5">
      {deal.isNewHigh && (
        <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-500">
          신고가
        </span>
      )}
      <span className="truncate text-sm font-semibold text-gray-900">{deal.aptName}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-xs text-gray-400">{deal.area}㎡</span>
      <span className="text-sm font-bold text-gray-900">{formatPrice(deal.price)}</span>
    </div>
    <p className="mt-0.5 text-xs text-gray-400">{deal.dealDate}</p>
  </div>
)
