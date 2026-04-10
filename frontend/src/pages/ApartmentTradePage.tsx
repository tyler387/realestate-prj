import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApartmentHeader } from '../components/features/trade/ApartmentHeader'
import { TradeTypeFilter, type TradeType } from '../components/features/trade/TradeTypeFilter'
import { PriceChart } from '../components/features/trade/PriceChart'
import { TradeHistoryList } from '../components/features/trade/TradeHistoryList'
import { mockApartments, mockTradeRecords, mockPriceHistory } from '../data/mockTradeData'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

export const ApartmentTradePage = () => {
  const { id } = useParams<{ id: string }>()
  const apartmentId = Number(id)
  const [selectedType, setSelectedType] = useState<TradeType>('all')
  const [isFavorite, setIsFavorite] = useState(false)
  const status = useUserStore((s) => s.status)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)

  const apartment = mockApartments.find((item) => item.apartmentId === apartmentId) ?? mockApartments[0]
  const records = mockTradeRecords.filter((record) => record.apartmentId === apartmentId)
  const priceHistory = mockTradeRecords.some((record) => record.apartmentId === apartmentId)
    ? mockPriceHistory
    : []

  const latestPrice = apartment.latestPrice
  const priceChangeRate = 2.2

  const handleFavoriteToggle = () => {
    if (status === 'GUEST') {
      openAuthSheet()
      return
    }

    setIsFavorite((value) => !value)
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
