import { useEffect, useState } from 'react'
import { TradeSearchBar } from '../components/features/trade/TradeSearchBar'
import { PeriodFilter } from '../components/features/trade/PeriodFilter'
import { TradeRankingList } from '../components/features/trade/TradeRankingList'
import { AptFilterBanner } from '../components/features/trade-sidebar/AptFilterBanner'
import { useUiStore } from '../stores/uiStore'
import { useTradeFilterStore } from '../stores/tradeFilterStore'
import { mockTradeRankings, mockApartments, type TradeRanking } from '../data/mockTradeData'

export const TradePage = () => {
  const { tradePeriod, setTradePeriod } = useUiStore()
  const { aptId, setAptId } = useTradeFilterStore()
  const [rankings, setRankings] = useState<TradeRanking[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      const base = mockTradeRankings[tradePeriod]
      const filtered = aptId
        ? base.filter((r) => String(r.apartmentId) === aptId.replace('apt-00', ''))
        : base
      setRankings(filtered)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [tradePeriod, aptId])

  const aptName = aptId
    ? (mockApartments.find((a) => `apt-00${a.apartmentId}` === aptId)?.apartmentName ?? aptId)
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
      <TradeRankingList rankings={rankings} isLoading={isLoading} />
    </div>
  )
}
