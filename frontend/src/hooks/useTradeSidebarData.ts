import { useQuery } from '@tanstack/react-query'
import {
  mockPriceTrend,
  mockHighestPriceDeals,
  mockTopTransactionApartments,
  type PriceTrendData,
  type HighestPriceDeal,
  type TopTransactionApartment,
} from '../data/mockTradeSidebarData'

const USE_MOCK = true

export const usePriceTrend = (
  regionId: string,
  subRegionId: string | null,
  period: '1w' | '1m',
) =>
  useQuery<PriceTrendData>({
    queryKey: ['trade', 'priceTrend', regionId, subRegionId, period],
    queryFn: () =>
      fetch(`/api/transactions/trend?regionId=${regionId}&period=${period}`).then((r) => r.json()),
    enabled: !USE_MOCK,
    placeholderData: USE_MOCK ? mockPriceTrend[period] : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })

export const useHighestPriceDeals = (regionId: string, subRegionId: string | null) =>
  useQuery<HighestPriceDeal[]>({
    queryKey: ['trade', 'highestDeals', regionId, subRegionId],
    queryFn: () =>
      fetch(`/api/transactions/highest?regionId=${regionId}`).then((r) => r.json()),
    enabled: !USE_MOCK,
    placeholderData: USE_MOCK ? mockHighestPriceDeals : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })

export const useTopTransactionApartments = (regionId: string, subRegionId: string | null) =>
  useQuery<TopTransactionApartment[]>({
    queryKey: ['trade', 'topApartments', regionId, subRegionId],
    queryFn: () =>
      fetch(`/api/transactions/top-apartments?regionId=${regionId}`).then((r) => r.json()),
    enabled: !USE_MOCK,
    placeholderData: USE_MOCK ? mockTopTransactionApartments : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
