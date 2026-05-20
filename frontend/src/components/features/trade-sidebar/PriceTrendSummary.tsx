import { useState } from 'react'
import { usePriceTrend, usePriceTrendCompare } from '../../../hooks/useTradeSidebarData'
import { formatPrice } from '../../../utils/formatPrice'
import { SidebarCard, CardTitle } from '../sidebar/SidebarCard'
import { PriceTrendSkeleton, ErrorMessage } from '../sidebar/SidebarSkeleton'
import { PeriodToggle } from './PeriodToggle'
import { ChangeRateBadge } from './ChangeRateBadge'

const CompareMetric = ({
  label,
  current,
  previous,
}: {
  label: string
  current: string
  previous: string
}) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-gray-900">{current}</p>
    <p className="mt-0.5 text-[11px] text-gray-400">직전 {previous}</p>
  </div>
)

export const PriceTrendSummary = () => {
  const [period, setPeriod] = useState<'1w' | '1m'>('1w')
  const [showComparison, setShowComparison] = useState(false)
  const { data, isLoading, isFetching, isError } = usePriceTrend(period)
  const { data: metrics, isFetching: isCompareFetching } = usePriceTrendCompare(period)

  return (
    <SidebarCard className="relative">
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>가격 흐름</CardTitle>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-gray-500">평균 거래가 요약</p>
        <button
          type="button"
          onClick={() => setShowComparison((v) => !v)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {showComparison ? '비교 숨기기' : '직전 기간 비교'}
        </button>
      </div>

      {isLoading && <PriceTrendSkeleton />}

      {!isLoading && isError && (
        <ErrorMessage text="데이터를 불러오지 못했습니다" />
      )}

      {!isLoading && !isError && data && (
        data.transactionCount === 0 ? (
          <ErrorMessage text="최근 거래 데이터가 없습니다" />
        ) : (
          <>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatPrice(data.avgPrice)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {data.transactionCount > 1 && <ChangeRateBadge rate={data.changeRate} />}
              <span className="text-xs text-gray-400">거래 {data.transactionCount}건</span>
            </div>

            {showComparison && metrics && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CompareMetric
                  label="중앙값"
                  current={formatPrice(metrics.currentMedian)}
                  previous={formatPrice(metrics.previousMedian)}
                />
                <CompareMetric
                  label="평균"
                  current={formatPrice(metrics.currentAvg)}
                  previous={formatPrice(metrics.previousAvg)}
                />
                <CompareMetric
                  label="거래량"
                  current={`${metrics.currentTransactionCount}건`}
                  previous={`${metrics.previousTransactionCount}건`}
                />
                <CompareMetric
                  label="상승률"
                  current={`${metrics.changeRate > 0 ? '+' : ''}${metrics.changeRate.toFixed(1)}%`}
                  previous="기준값"
                />
              </div>
            )}
          </>
        )
      )}

      {(isFetching || isCompareFetching) && data && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/60" />
      )}
    </SidebarCard>
  )
}
