import { useQuery } from '@tanstack/react-query'
import { TradeSearchBar } from '../components/features/trade/TradeSearchBar'
import { PeriodFilter } from '../components/features/trade/PeriodFilter'
import { TradeRankingList } from '../components/features/trade/TradeRankingList'
import { AptFilterBanner } from '../components/features/trade-sidebar/AptFilterBanner'
import { useUiStore } from '../stores/uiStore'
import { useTradeFilterStore } from '../stores/tradeFilterStore'
import type { TopApartment } from '../types/trade'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export const TradePage = () => {
  const { tradePeriod, setTradePeriod } = useUiStore()
  const { aptId, setAptId } = useTradeFilterStore()

  const { data: rankings = [], isLoading } = useQuery<TopApartment[]>({
    queryKey: ['trade', 'topApartments', tradePeriod],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/trades/top-apartments?period=${tradePeriod}`)
        .then((r) => r.json())
        .then((data: Array<{ rank: number; aptId: number; aptName: string; sigungu: string; transactionCount: number; latestSalePrice: number | null }>) =>
          data.map((d) => ({
            rank: d.rank,
            aptId: d.aptId,
            aptName: d.aptName,
            sigungu: d.sigungu ?? '',
            transactionCount: d.transactionCount,
            latestSalePrice: d.latestSalePrice,
          }))
        ),
    staleTime: 1000 * 60 * 5,
  })

  const filtered = aptId
    ? rankings.filter((r) => String(r.aptId) === aptId)
    : rankings

  const aptName = aptId
    ? (rankings.find((r) => String(r.aptId) === aptId)?.aptName ?? aptId)
    : null

  return (
    <div className="flex flex-col">
      <TradeSearchBar />

      {aptId && aptName && (
        <AptFilterBanner aptName={aptName} onClear={() => setAptId(null)} />
      )}

      <PeriodFilter value={tradePeriod} onChange={setTradePeriod} />
      <p className="px-4 py-2 text-sm font-bold text-gray-500">
        🔥 실거래 많은 아파트 TOP 20
      </p>
      <TradeRankingList rankings={filtered} isLoading={isLoading} />
    </div>
  )
}
