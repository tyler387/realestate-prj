import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TradeSearchBar } from '../components/features/trade/TradeSearchBar'
import { PeriodFilter } from '../components/features/trade/PeriodFilter'
import { TradeRankingList } from '../components/features/trade/TradeRankingList'
import { AptFilterBanner } from '../components/features/trade-sidebar/AptFilterBanner'
import { useUiStore } from '../stores/uiStore'
import { useTradeFilterStore } from '../stores/tradeFilterStore'
import type { TopApartment } from '../types/trade'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export const TradePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    tradePeriod,
    setTradePeriod,
    tradeCustomStartDate,
    tradeCustomEndDate,
    setTradeCustomDateRange,
  } = useUiStore()
  const {
    aptId, setAptId,
    priceRange, setPriceRange,
    dealType, setDealType,
    areaRange, setAreaRange,
    preset, setPreset,
    floorBand, setFloorBand,
    yearBand, setYearBand,
    complexKeyword, setComplexKeyword,
    excludeOutliers, setExcludeOutliers,
    setResultCount,
  } = useTradeFilterStore()

  const isCustomRangeValid =
    tradePeriod === 'custom'
    && !!tradeCustomStartDate
    && !!tradeCustomEndDate
    && tradeCustomStartDate <= tradeCustomEndDate

  const { data: rankings = [], isLoading, isFetching } = useQuery<TopApartment[]>({
    queryKey: [
      'trade',
      'topApartments',
      tradePeriod,
      tradeCustomStartDate,
      tradeCustomEndDate,
      priceRange,
      dealType,
      areaRange,
      preset,
      floorBand,
      yearBand,
      complexKeyword,
      excludeOutliers,
    ],
    queryFn: () => {
      const params = new URLSearchParams({ period: tradePeriod })
      if (priceRange) params.set('priceRange', priceRange)
      if (dealType) params.set('dealType', dealType)
      if (areaRange) params.set('areaRange', areaRange)
      if (preset) params.set('preset', preset)
      if (floorBand) params.set('floorBand', floorBand)
      if (yearBand) params.set('yearBand', yearBand)
      if (complexKeyword) params.set('complexKeyword', complexKeyword)
      if (excludeOutliers) params.set('excludeOutliers', 'true')
      if (isCustomRangeValid) {
        params.set('startDate', tradeCustomStartDate as string)
        params.set('endDate', tradeCustomEndDate as string)
      }

      return fetch(`${API_BASE_URL}/api/v1/trades/top-apartments?${params.toString()}`)
        .then((r) => r.json())
        .then((data: Array<{ rank: number; aptId: number; aptName: string; sigungu: string; transactionCount: number; recentMonthAvgPrice: number | null }>) =>
          data.map((d) => ({
            rank: d.rank,
            aptId: d.aptId,
            aptName: d.aptName,
            sigungu: d.sigungu ?? '',
            transactionCount: d.transactionCount,
            recentMonthAvgPrice: d.recentMonthAvgPrice,
          }))
        )
    },
    staleTime: 1000 * 60 * 5,
    enabled: tradePeriod !== 'custom' || isCustomRangeValid,
  })

  const filtered = aptId
    ? rankings.filter((r) => String(r.aptId) === aptId)
    : rankings

  useEffect(() => {
    if (isFetching) {
      setResultCount(null)
      return
    }
    setResultCount(filtered.length)
  }, [filtered.length, isFetching, setResultCount])

  useEffect(() => {
    const aptIdParam = searchParams.get('aptId')
    const priceRangeParam = searchParams.get('priceRange') as 'UNDER_10' | '10_20' | 'OVER_20' | null
    const dealTypeParam = searchParams.get('dealType') as 'SALE' | 'JEONSE' | 'MONTHLY' | null
    const areaRangeParam = searchParams.get('areaRange') as '20' | '30' | '40' | null
    const presetParam = searchParams.get('preset') as 'NEW' | 'LARGE' | 'HOT' | null
    const floorBandParam = searchParams.get('floorBand') as 'LOW' | 'MID' | 'HIGH' | null
    const yearBandParam = searchParams.get('yearBand') as 'NEW_0_10' | 'MID_11_20' | 'OLD_21_PLUS' | null
    const complexKeywordParam = searchParams.get('complexKeyword')
    const periodParam = searchParams.get('period') as '1m' | '3m' | '6m' | '12m' | 'custom' | null
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (aptIdParam !== aptId) setAptId(aptIdParam)
    if (priceRangeParam !== priceRange) setPriceRange(priceRangeParam)
    if (dealTypeParam !== dealType) setDealType(dealTypeParam)
    if (areaRangeParam !== areaRange) setAreaRange(areaRangeParam)
    if (presetParam !== preset) setPreset(presetParam)
    if (floorBandParam !== floorBand) setFloorBand(floorBandParam)
    if (yearBandParam !== yearBand) setYearBand(yearBandParam)
    if (complexKeywordParam !== complexKeyword) setComplexKeyword(complexKeywordParam)
    if (periodParam && periodParam !== tradePeriod) setTradePeriod(periodParam)
    if (startDateParam !== tradeCustomStartDate || endDateParam !== tradeCustomEndDate) {
      setTradeCustomDateRange(startDateParam, endDateParam)
    }
    setExcludeOutliers(searchParams.get('excludeOutliers') === '1' || searchParams.get('excludeOutliers') === 'true')
  // initialize from URL once on page load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const next = new URLSearchParams()
    next.set('period', tradePeriod)
    if (aptId) next.set('aptId', aptId)
    if (priceRange) next.set('priceRange', priceRange)
    if (dealType) next.set('dealType', dealType)
    if (areaRange) next.set('areaRange', areaRange)
    if (preset) next.set('preset', preset)
    if (floorBand) next.set('floorBand', floorBand)
    if (yearBand) next.set('yearBand', yearBand)
    if (complexKeyword) next.set('complexKeyword', complexKeyword)
    if (excludeOutliers) next.set('excludeOutliers', '1')
    if (tradePeriod === 'custom' && tradeCustomStartDate && tradeCustomEndDate) {
      next.set('startDate', tradeCustomStartDate)
      next.set('endDate', tradeCustomEndDate)
    }

    const nextString = next.toString()
    const currentString = searchParams.toString()
    if (nextString !== currentString) setSearchParams(next, { replace: true })
  }, [
    tradePeriod,
    tradeCustomStartDate,
    tradeCustomEndDate,
    aptId,
    priceRange,
    dealType,
    areaRange,
    preset,
    floorBand,
    yearBand,
    complexKeyword,
    excludeOutliers,
    searchParams,
    setSearchParams,
  ])

  const aptName = aptId
    ? (rankings.find((r) => String(r.aptId) === aptId)?.aptName ?? aptId)
    : null

  return (
    <div className="flex flex-col">
      <TradeSearchBar />

      {aptId && aptName && (
        <AptFilterBanner aptName={aptName} onClear={() => setAptId(null)} />
      )}

      <PeriodFilter
        value={tradePeriod}
        startDate={tradeCustomStartDate}
        endDate={tradeCustomEndDate}
        onChange={setTradePeriod}
        onCustomDateChange={setTradeCustomDateRange}
      />
      <p className="px-4 py-2 text-sm font-bold text-gray-500">
        실거래 많은 아파트 TOP 20
      </p>
      <TradeRankingList rankings={filtered} isLoading={isLoading} />
    </div>
  )
}

