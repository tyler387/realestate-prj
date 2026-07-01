import { useNavigate } from 'react-router-dom'
import { type TopApartment } from '../../../types/trade'
import { formatPrice } from '../../../utils/formatPrice'

type Props = { ranking: TopApartment }

export const TradeRankingCard = ({ ranking }: Props) => {
  const navigate = useNavigate()
  const { rank, aptId, aptName, sigungu, transactionCount, recentMonthAvgPrice } = ranking
  const isTop3 = rank <= 3

  return (
    <div
      className={`mx-4 mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-line-base bg-surface-base p-4 transition-all hover:border-brand-100 hover:shadow-panel ${
        isTop3 ? 'border-l-4 border-l-brand-600' : ''
      }`}
      onClick={() => navigate(`/trade/apartment/${aptId}`, { state: { apartmentName: aptName } })}
    >
      <div className={`w-8 text-center tabular-nums ${isTop3 ? 'text-xl font-black text-brand-700' : 'text-base font-bold text-text-subtle'}`}>
        {rank}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-text-strong">{aptName}</p>
        <p className="mt-0.5 text-xs font-medium text-text-subtle">{sigungu}</p>
        {recentMonthAvgPrice != null && (
          <p className="mt-1 text-sm font-medium text-text-body">최근 1개월 평균 {formatPrice(recentMonthAvgPrice)}</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-base font-black text-brand-700 tabular-nums">{transactionCount}건</p>
        <p className="mt-0.5 text-[11px] font-medium text-text-subtle">거래량</p>
      </div>
    </div>
  )
}
