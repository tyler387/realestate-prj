import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApartmentHeader } from '../components/features/trade/ApartmentHeader'
import { TradeTypeFilter, type TradeType } from '../components/features/trade/TradeTypeFilter'
import { PriceChart } from '../components/features/trade/PriceChart'
import { TradeHistoryList } from '../components/features/trade/TradeHistoryList'
import { useApartmentTrade } from '../hooks/useApartmentTrade'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

export const ApartmentTradePage = () => {
  const { id } = useParams<{ id: string }>()
  const aptId = Number(id)
  const [selectedType, setSelectedType] = useState<TradeType>('all')
  const [isFavorite, setIsFavorite] = useState(false)
  const status = useUserStore((s) => s.status)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)

  const { summaryQuery, tradesQuery, priceHistoryQuery } = useApartmentTrade(aptId)

  const apartment = summaryQuery.data
  const records = tradesQuery.data ?? []
  const priceHistory = priceHistoryQuery.data ?? []

  const latestPrice = apartment?.latestPrice ?? 0
  const priceChangeRate = (() => {
    const sale = priceHistory.filter((h) => h.tradeType === '매매')
    if (sale.length < 2) return 0
    const last = sale[sale.length - 1].avgPrice
    const prev = sale[sale.length - 2].avgPrice
    if (!prev) return 0
    return Math.round(((last - prev) / prev) * 1000) / 10
  })()

  const handleFavoriteToggle = () => {
    if (status === 'GUEST') {
      openAuthSheet()
      return
    }
    setIsFavorite((value) => !value)
  }

  if (summaryQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (!apartment) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-gray-400">아파트 정보를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <ApartmentHeader
        apartment={apartment}
        latestPrice={latestPrice}
        priceChangeRate={priceChangeRate}
        isFavorite={isFavorite}
        onFavoriteToggle={handleFavoriteToggle}
      />
      <TradeTypeFilter value={selectedType} onChange={setSelectedType} />
      <PriceChart data={priceHistory} tradeType={selectedType} />
      <p className="px-4 py-2 text-sm font-semibold text-gray-700">최근 실거래 내역</p>
      <TradeHistoryList records={records} selectedType={selectedType} />
    </div>
  )
}
