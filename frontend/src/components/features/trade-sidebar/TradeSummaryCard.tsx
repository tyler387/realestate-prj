import { usePriceTrend, usePriceTrendCompare } from '../../../hooks/useTradeSidebarData'
import { formatPrice } from '../../../utils/formatPrice'
import { SidebarCard, CardTitle } from '../sidebar/SidebarCard'
import { ErrorMessage } from '../sidebar/SidebarSkeleton'

const TrendText = ({ changeRate }: { changeRate: number }) => {
  if (changeRate > 0) {
    return <span className="text-xs font-medium text-red-500">상승 추세 ({changeRate.toFixed(1)}%)</span>
  }

  if (changeRate < 0) {
    return <span className="text-xs font-medium text-blue-500">하락 추세 ({Math.abs(changeRate).toFixed(1)}%)</span>
  }

  return <span className="text-xs font-medium text-gray-500">보합 추세 (0.0%)</span>
}

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
  </div>
)

export const TradeSummaryCard = () => {
  const { data: oneMonth, isLoading, isFetching: isOneMonthFetching, isError } = usePriceTrend('1m')
  const { data: threeMonth, isFetching: isThreeMonthFetching } = usePriceTrend('3m')
  const { data: compare, isFetching: isCompareFetching } = usePriceTrendCompare('1m')

  if (!isLoading && (isError || !oneMonth)) {
    return (
      <SidebarCard>
        <CardTitle>요약 카드</CardTitle>
        <ErrorMessage text="요약 데이터를 불러오지 못했습니다" />
      </SidebarCard>
    )
  }

  if (isLoading || !oneMonth || !compare) {
    return (
      <SidebarCard>
        <CardTitle>요약 카드</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </SidebarCard>
    )
  }

  const recentPrice = formatPrice(oneMonth.avgPrice)
  const changeValue = `${compare.changeRate > 0 ? '+' : ''}${compare.changeRate.toFixed(1)}%`
  const transactionCount = `${oneMonth.transactionCount}건`

  return (
    <SidebarCard className="relative">
      <CardTitle>요약 카드</CardTitle>

      <div className="grid grid-cols-2 gap-2">
        <SummaryItem label="최근 거래가" value={recentPrice} />
        <SummaryItem label="직전 대비" value={changeValue} />
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
          <p className="text-[11px] text-gray-500">최근 3개월 추세</p>
          <div className="mt-1">
            <TrendText changeRate={threeMonth?.changeRate ?? oneMonth.changeRate} />
          </div>
        </div>
        <SummaryItem label="거래건수" value={transactionCount} />
      </div>

      {(isOneMonthFetching || isThreeMonthFetching || isCompareFetching) && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/60" />
      )}
    </SidebarCard>
  )
}
