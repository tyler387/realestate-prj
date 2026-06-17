import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TradeSearchBar } from '../components/features/trade/TradeSearchBar'
import { PeriodFilter } from '../components/features/trade/PeriodFilter'
import { TradeRankingList } from '../components/features/trade/TradeRankingList'
import { AptFilterBanner } from '../components/features/trade-sidebar/AptFilterBanner'
import { MobileTradeFilterDrawer } from '../components/features/trade-sidebar/MobileTradeFilterDrawer'
import { useUiStore } from '../stores/uiStore'
import { useTradeFilterStore } from '../stores/tradeFilterStore'
import type { TopApartment } from '../types/trade'
import { UNSUPPORTED_RENT_NOTICE, isUnsupportedRentDealType, normalizeSupportedDealType } from '../utils/tradeType'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export const TradePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [showUnsupportedDealTypeNotice, setShowUnsupportedDealTypeNotice] = useState(false)
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

  const effectiveDealType = normalizeSupportedDealType(dealType)

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
      if (effectiveDealType) params.set('dealType', effectiveDealType)
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
    // URL 공유/직접 진입 시 query를 store로 1회 복원한다.
    const aptIdParam = searchParams.get('aptId')
    const priceRangeParam = searchParams.get('priceRange') as 'UNDER_10' | '10_20' | 'OVER_20' | null
    const rawDealTypeParam = searchParams.get('dealType') as 'SALE' | 'JEONSE' | 'MONTHLY' | null
    const dealTypeParam = normalizeSupportedDealType(rawDealTypeParam)
    const areaRangeParam = searchParams.get('areaRange') as '20' | '30' | '40' | null
    const presetParam = searchParams.get('preset') as 'NEW' | 'LARGE' | 'HOT' | null
    const floorBandParam = searchParams.get('floorBand') as 'LOW' | 'MID' | 'HIGH' | null
    const yearBandParam = searchParams.get('yearBand') as 'NEW_0_10' | 'MID_11_20' | 'OLD_21_PLUS' | null
    const complexKeywordParam = searchParams.get('complexKeyword')
    const periodParam = searchParams.get('period') as '1m' | '3m' | '6m' | '12m' | 'custom' | null
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (isUnsupportedRentDealType(rawDealTypeParam)) setShowUnsupportedDealTypeNotice(true)

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
    // store가 바뀌면 URL을 갱신해 필터 상태를 공유 가능하게 유지한다.
    const next = new URLSearchParams()
    next.set('period', tradePeriod)
    if (aptId) next.set('aptId', aptId)
    if (priceRange) next.set('priceRange', priceRange)
    if (effectiveDealType) next.set('dealType', effectiveDealType)
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
    effectiveDealType,
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

  const activeFilterCount = [
    aptId,
    priceRange,
    dealType,
    areaRange,
    preset,
    floorBand,
    yearBand,
    complexKeyword,
    excludeOutliers ? 'excludeOutliers' : null,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col">
      <TradeSearchBar />

      <div className="px-4 pt-2 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-blue-200"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            필터
          </span>
          <span className="text-xs font-medium text-gray-500">
            {activeFilterCount > 0 ? `${activeFilterCount}개 적용` : '전체 조건'}
          </span>
        </button>
      </div>

      {aptId && aptName && (
        <AptFilterBanner aptName={aptName} onClear={() => setAptId(null)} />
      )}

      {showUnsupportedDealTypeNotice && (
        <div className="mx-4 mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-700">{UNSUPPORTED_RENT_NOTICE}</p>
        </div>
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
      <MobileTradeFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />
    </div>
  )
}

