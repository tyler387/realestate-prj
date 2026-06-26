import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApartmentHeader } from '../components/features/trade/ApartmentHeader'
import { TradeTypeFilter, type TradeType } from '../components/features/trade/TradeTypeFilter'
import { PriceChart } from '../components/features/trade/PriceChart'
import { TradeHistoryList } from '../components/features/trade/TradeHistoryList'
import { useApartmentTrade, type PriceHistoryRange } from '../hooks/useApartmentTrade'
import { useTradeFilterStore } from '../stores/tradeFilterStore'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'
import { RENT_READY_NOTICE, normalizeSupportedDealType } from '../utils/tradeType'

const DEAL_TYPE_TO_TRADE_TYPE: Record<'SALE', Exclude<TradeType, 'all'>> = {
  SALE: '매매',
}

export const ApartmentTradePage = () => {
  const { id } = useParams<{ id: string }>()
  const aptId = Number(id)
  const [selectedType, setSelectedType] = useState<TradeType>('all')
  const [selectedArea, setSelectedArea] = useState<number | null>(null)
  // 상세 차트 기간은 상단 실거래 목록 기간 필터와 독립적으로 운용한다.
  const [priceHistoryRange, setPriceHistoryRange] = useState<PriceHistoryRange>('1y')
  const [isFavorite, setIsFavorite] = useState(false)
  const status = useUserStore((s) => s.status)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)
  const dealType = useTradeFilterStore((s) => s.dealType)

  const { summaryQuery, tradesQuery, tradeAreasQuery, priceHistoryQuery } = useApartmentTrade(
    aptId,
    selectedArea,
    priceHistoryRange,
  )

  const apartment = summaryQuery.data
  const records = tradesQuery.data?.records ?? []
  const tradeRecordLimit = tradesQuery.data?.limit
  const hasMoreTradeRecords = tradesQuery.data?.hasMore ?? false
  const areaOptions = tradeAreasQuery.data ?? []
  const priceHistory = priceHistoryQuery.data ?? []
  const effectiveDealType = normalizeSupportedDealType(dealType)

  useEffect(() => {
    // 외부 상태로 전월세 타입이 유입돼도 상세 탭은 매매 중심 UX로 복구한다.
    if (selectedType === '전세' || selectedType === '월세') setSelectedType('all')
  }, [selectedType])

  useEffect(() => {
    if (areaOptions.length === 0) return
    const hasSelectedArea = selectedArea != null && areaOptions.some((option) => option.area === selectedArea)
    if (!hasSelectedArea) setSelectedArea(areaOptions[0].area)
  }, [areaOptions, selectedArea])

  const latestPrice = apartment?.latestPrice ?? 0
  const tradeHistoryTitle = priceHistoryRange === 'all' ? '전체 실거래 내역' : '최근 1년 실거래 내역'
  const chartTradeType =
    selectedType === 'all' && effectiveDealType
      ? DEAL_TYPE_TO_TRADE_TYPE[effectiveDealType]
      : selectedType

  const priceChangeRate = (() => {
    const sale = priceHistory.filter((history) => history.tradeType === '매매')
    if (sale.length < 2) return 0
    const last = sale[sale.length - 1].avgPrice
    const prev = sale[sale.length - 2].avgPrice
    if (!prev) return 0
    return Math.round(((last - prev) / prev) * 1000) / 10
  })()

  const handleFavoriteToggle = () => {
    if (status === 'GUEST') {
      openAuthSheet('favorite')
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
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
        <p className="text-xs text-gray-500">{RENT_READY_NOTICE}</p>
      </div>
      <PriceChart
        data={priceHistory}
        records={records}
        tradeType={chartTradeType}
        areaOptions={areaOptions}
        selectedArea={selectedArea}
        onAreaChange={setSelectedArea}
        priceHistoryRange={priceHistoryRange}
        onPriceHistoryRangeChange={setPriceHistoryRange}
        isTradeRecordLimited={hasMoreTradeRecords}
        tradeRecordLimit={tradeRecordLimit}
      />
      <p className="px-4 py-2 text-sm font-semibold text-gray-700">{tradeHistoryTitle}</p>
      <TradeHistoryList
        records={records}
        selectedType={selectedType}
        selectedArea={selectedArea}
        limit={tradeRecordLimit}
        hasMore={hasMoreTradeRecords}
      />
    </div>
  )
}
