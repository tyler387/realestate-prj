import { useNavigate } from 'react-router-dom'
import { type TopApartment } from '../../../types/trade'
import { formatPrice } from '../../../utils/formatPrice'

type Props = { ranking: TopApartment }

export const TradeRankingCard = ({ ranking }: Props) => {
  const navigate = useNavigate()
  const { rank, aptId, aptName, sigungu, transactionCount, latestSalePrice } = ranking
  const isTop3 = rank <= 3

  return (
    <div
      className={`mx-4 mb-2 flex cursor-pointer items-center gap-3 rounded-xl bg-white p-4 shadow-sm ${isTop3 ? 'border-l-4 border-blue-500' : ''}`}
      onClick={() => navigate(`/trade/apartment/${aptId}`, { state: { apartmentName: aptName } })}
    >
      <div className={`w-8 text-center ${isTop3 ? 'text-xl font-bold text-blue-500' : 'text-base font-bold text-gray-400'}`}>
        {rank}
      </div>

      <div className="flex-1">
        <p className="text-base font-semibold text-gray-900">{aptName}</p>
        <p className="mt-0.5 text-xs text-gray-400">{sigungu}</p>
        {latestSalePrice != null && (
          <p className="mt-1 text-sm text-gray-700">{formatPrice(latestSalePrice)}</p>
        )}
      </div>

      <div className="text-right">
        <p className="text-base font-bold text-blue-500">{transactionCount}건</p>
      </div>
    </div>
  )
}
