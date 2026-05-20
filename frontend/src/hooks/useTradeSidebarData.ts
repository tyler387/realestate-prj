import { useQuery } from '@tanstack/react-query'
import type {
  PriceTrendData,
  PriceTrendCompareData,
  HighestPriceDeal,
  TopTransactionApartment,
} from '../types/sidebar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'
type TrendPeriod = '1w' | '1m' | '3m' | '6m' | '12m'

export const usePriceTrend = (period: TrendPeriod) =>
  useQuery<PriceTrendData>({
    queryKey: ['trade', 'priceTrend', period],
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/trades/trend?period=${period}`)
        .then((r) => r.json())
        .then((data) => ({
          period: data.period as TrendPeriod,
          avgPrice: data.avgPrice ?? 0,
          changeRate: data.changeRate ?? 0,
          transactionCount: data.transactionCount ?? 0,
        })),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
  })

export const usePriceTrendCompare = (period: TrendPeriod) =>
  useQuery<PriceTrendCompareData>({
    queryKey: ['trade', 'priceTrendCompare', period],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/trades/trend/compare?period=${period}`)
      if (!response.ok) throw new Error('Failed to load trend compare data')

      const data = await response.json()
      return {
        currentMedian: data.currentMedian ?? 0,
        currentAvg: data.currentAvg ?? 0,
        currentTransactionCount: data.currentTransactionCount ?? 0,
        previousMedian: data.previousMedian ?? 0,
        previousAvg: data.previousAvg ?? 0,
        previousTransactionCount: data.previousTransactionCount ?? 0,
        changeRate: data.changeRate ?? 0,
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
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
