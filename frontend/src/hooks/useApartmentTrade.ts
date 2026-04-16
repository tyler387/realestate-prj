import { useQuery } from '@tanstack/react-query'
import type { TradeApartment as Apartment, TradeRecord, PriceHistory } from '../types/trade'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

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
  contractDate: string
  pricePerPyeong: number | null
}

type ApiPriceHistory = {
  month: string
  avgPrice: number
  tradeType: string
}

export const useApartmentTrade = (aptId: number) => {
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

  const tradesQuery = useQuery<TradeRecord[]>({
    queryKey: ['apartment', 'trades', aptId],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/apartments/${aptId}/trades`)
        .then((r) => r.json())
        .then((data: ApiTrade[]) =>
          data.map((t) => ({
            id: t.id,
            apartmentId: aptId,
            floor: t.floor != null ? `${t.floor}층` : '-',
            area: t.area ?? 0,
            tradeType: (t.tradeType as '매매' | '전세' | '월세') ?? '매매',
            price: t.tradeAmount ?? 0,
            contractDate: t.contractDate ?? '-',
          }))
        ),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 10,
  })

  const priceHistoryQuery = useQuery<PriceHistory[]>({
    queryKey: ['apartment', 'priceHistory', aptId],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/apartments/${aptId}/price-history`)
        .then((r) => r.json())
        .then((data: ApiPriceHistory[]) =>
          data.map((h) => ({
            month: h.month,
            avgPrice: h.avgPrice,
            tradeType: (h.tradeType as '매매' | '전세' | '월세') ?? '매매',
          }))
        ),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 10,
  })

  return { summaryQuery, tradesQuery, priceHistoryQuery }
}
