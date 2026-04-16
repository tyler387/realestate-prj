import { useQuery } from '@tanstack/react-query'
import type {
  PriceTrendData,
  HighestPriceDeal,
  TopTransactionApartment,
} from '../types/sidebar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export const usePriceTrend = (period: '1w' | '1m') =>
  useQuery<PriceTrendData>({
    queryKey: ['trade', 'priceTrend', period],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/trades/trend?period=${period}`)
        .then((r) => r.json())
        .then((data) => ({
          period: data.period as '1w' | '1m',
          avgPrice: data.avgPrice ?? 0,
          changeRate: data.changeRate ?? 0,
          transactionCount: data.transactionCount ?? 0,
        })),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

export const useHighestPriceDeals = () =>
  useQuery<HighestPriceDeal[]>({
    queryKey: ['trade', 'highestDeals'],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/trades/highest`)
        .then((r) => r.json())
        .then((data: Array<{ aptId: number; aptName: string; price: number; dealDate: string; area: number; isNewHigh: boolean }>) =>
          data.map((d) => ({
            aptId: String(d.aptId),
            aptName: d.aptName,
            price: d.price,
            dealDate: d.dealDate,
            area: d.area,
            isNewHigh: d.isNewHigh,
          }))
        ),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

export const useTopTransactionApartments = () =>
  useQuery<TopTransactionApartment[]>({
    queryKey: ['trade', 'topApartments'],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/trades/top-apartments`)
        .then((r) => r.json())
        .then((data: Array<{ rank: number; aptId: number; aptName: string; transactionCount: number }>) =>
          data.map((d) => ({
            rank: d.rank,
            aptId: String(d.aptId),
            aptName: d.aptName,
            transactionCount: d.transactionCount,
          }))
        ),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
