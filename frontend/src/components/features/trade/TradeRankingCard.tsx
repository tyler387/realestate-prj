import { useNavigate } from 'react-router-dom'
import { type TradeRanking } from '../../../data/mockTradeData'
import { formatPrice } from '../../../utils/formatPrice'

type Props = { ranking: TradeRanking }

export const TradeRankingCard = ({ ranking }: Props) => {
  const navigate = useNavigate()
  const { rank, apartmentId, apartmentName, address, tradeCount, latestPrice, priceChangeRate } = ranking

  const isTop3 = rank <= 3

  return (
    <div
      className={`mx-4 mb-2 flex cursor-pointer items-center gap-3 rounded-xl bg-white p-4 shadow-sm ${isTop3 ? 'border-l-4 border-blue-500' : ''}`}
      onClick={() => navigate(`/trade/apartment/${apartmentId}`, { state: { apartmentName } })}
    >
      <div className={`w-8 text-center ${isTop3 ? 'text-xl font-bold text-blue-500' : 'text-base font-bold text-gray-400'}`}>
        {rank}
      </div>

      <div className="flex-1">
        <p className="text-base font-semibold text-gray-900">{apartmentName}</p>
        <p className="mt-0.5 text-xs text-gray-400">{address}</p>
        <p className="mt-1 text-sm text-gray-700">{formatPrice(latestPrice)}</p>
      </div>

      <div className="text-right">
        <p className="text-base font-bold text-blue-500">{tradeCount}건</p>
        <p
          className={`mt-0.5 text-xs ${
            priceChangeRate > 0
              ? 'text-red-500'
              : priceChangeRate < 0
                ? 'text-blue-400'
                : 'text-gray-400'
          }`}
        >
          {priceChangeRate > 0
            ? `+${priceChangeRate.toFixed(1)}%`
            : priceChangeRate < 0
              ? `-${Math.abs(priceChangeRate).toFixed(1)}%`
              : '0%'}
        </p>
      </div>
    </div>
  )
}
