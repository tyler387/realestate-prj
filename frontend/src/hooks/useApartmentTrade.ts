import { useQuery } from '@tanstack/react-query'
import type { TradeApartment as Apartment, TradeAreaOption, TradeRecord, PriceHistory } from '../types/trade'
import { useTradeFilterStore } from '../stores/tradeFilterStore'
import { normalizeSupportedDealType, toTradeTypeLabel } from '../utils/tradeType'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export type PriceHistoryRange = '1y' | 'all'

type ApiSummary = {
  id: number
  complexName: string
  location: string
  totalHouseholdCount: number | null
  completionYear: number | null
  recentSalePrice: number | null
}

type ApiTrade = {
  id: number
  floor: number | null
  area: number | null
  tradeType: string
  tradeAmount: number | null
  depositAmount: number | null
  monthlyRentAmount: number | null
  contractDate: string
  pricePerPyeong: number | null
}

type ApiPriceHistory = {
  month: string
  avgPrice: number
  avgPricePerPyeong: number | null
  transactionCount: number | null
  tradeType: string
}

type ApiTradeAreaOption = {
  area: number
  transactionCount: number | null
}

type ApiTradeResponse = {
  records: ApiTrade[]
  displayedCount: number
  limit: number
  hasMore: boolean
}

export type TradeRecordResult = {
  records: TradeRecord[]
  displayedCount: number
  limit: number
  hasMore: boolean
}

const toAreaParam = (area: number) => {
  const fixed = area.toFixed(4)
  return fixed.replace(/\.?0+$/, '')
}

export const useApartmentTrade = (
  aptId: number,
  selectedArea: number | null,
  priceHistoryRange: PriceHistoryRange,
) => {
  const {
    priceRange,
    dealType,
    areaRange,
    preset,
    floorBand,
    yearBand,
    complexKeyword,
    excludeOutliers,
  } = useTradeFilterStore()

  const effectiveDealType = normalizeSupportedDealType(dealType)

  // 상세의 가격흐름/거래내역은 같은 최근 1년/전체 기준으로 조회한다.
  const buildDetailRangeParams = () => {
    const params = new URLSearchParams({
      period: priceHistoryRange === 'all' ? 'all' : '12m',
    })
    if (priceRange) params.set('priceRange', priceRange)
    if (effectiveDealType) params.set('dealType', effectiveDealType)
    if (areaRange) params.set('areaRange', areaRange)
    if (preset) params.set('preset', preset)
    if (floorBand) params.set('floorBand', floorBand)
    if (yearBand) params.set('yearBand', yearBand)
    if (complexKeyword) params.set('complexKeyword', complexKeyword)
    if (excludeOutliers) params.set('excludeOutliers', 'true')
    if (selectedArea != null) {
      params.set('exclusiveArea', toAreaParam(selectedArea))
    }

    const query = params.toString()
    return query ? `?${query}` : ''
  }

  const summaryQuery = useQuery<Apartment>({
    queryKey: ['apartment', 'detail', aptId],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/apartments/${aptId}/summary`)
        .then((r) => r.json())
        .then((data: ApiSummary) => ({
          apartmentId: data.id,
          apartmentName: data.complexName,
          address: data.location ?? '-',
          latestPrice: data.recentSalePrice ?? 0,
        })),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 60,
  })

  const tradesQuery = useQuery<TradeRecordResult>({
    queryKey: [
      'apartment',
      'trades',
      aptId,
      selectedArea,
      priceHistoryRange,
      priceRange,
      dealType,
      areaRange,
      preset,
      floorBand,
      yearBand,
      complexKeyword,
      excludeOutliers,
    ],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/apartments/${aptId}/trades${buildDetailRangeParams()}`)
        .then((r) => r.json())
        .then((data: ApiTradeResponse) => ({
          records: data.records.map((t) => ({
            id: t.id,
            apartmentId: aptId,
            floor: t.floor != null ? String(t.floor) : '-',
            area: t.area ?? 0,
            tradeType: toTradeTypeLabel(t.tradeType),
            price: t.tradeAmount ?? 0,
            pricePerPyeong: t.pricePerPyeong,
            deposit: t.depositAmount ?? undefined,
            monthlyRent: t.monthlyRentAmount ?? undefined,
            contractDate: t.contractDate ?? '-',
          })),
          displayedCount: data.displayedCount,
          limit: data.limit,
          hasMore: data.hasMore,
        })),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 10,
  })

  const tradeAreasQuery = useQuery<TradeAreaOption[]>({
    queryKey: ['apartment', 'tradeAreas', aptId],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/apartments/${aptId}/trade-areas`)
        .then((r) => r.json())
        .then((data: ApiTradeAreaOption[]) =>
          data
            .map((item) => ({
              area: item.area,
              transactionCount: item.transactionCount ?? 0,
            }))
            .filter((item) => item.area > 0)
        ),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 60,
  })

  const priceHistoryQuery = useQuery<PriceHistory[]>({
    queryKey: [
      'apartment',
      'priceHistory',
      aptId,
      selectedArea,
      priceHistoryRange,
      priceRange,
      dealType,
      areaRange,
      preset,
      floorBand,
      yearBand,
      complexKeyword,
      excludeOutliers,
    ],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/apartments/${aptId}/price-history${buildDetailRangeParams()}`)
        .then((r) => r.json())
        .then((data: ApiPriceHistory[]) =>
          data.map((h) => ({
            month: h.month,
            avgPrice: h.avgPrice,
            avgPricePerPyeong: h.avgPricePerPyeong ?? null,
            transactionCount: h.transactionCount ?? 0,
            tradeType: toTradeTypeLabel(h.tradeType),
          }))
        ),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 10,
  })

  return { summaryQuery, tradesQuery, tradeAreasQuery, priceHistoryQuery }
}
