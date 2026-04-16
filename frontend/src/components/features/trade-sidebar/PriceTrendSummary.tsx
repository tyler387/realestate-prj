import { useState } from 'react'
import { usePriceTrend } from '../../../hooks/useTradeSidebarData'
import { formatPrice } from '../../../utils/formatPrice'
import { SidebarCard, CardTitle } from '../sidebar/SidebarCard'
import { PriceTrendSkeleton, ErrorMessage } from '../sidebar/SidebarSkeleton'
import { PeriodToggle } from './PeriodToggle'
import { ChangeRateBadge } from './ChangeRateBadge'

export const PriceTrendSummary = () => {
  const [period, setPeriod] = useState<'1w' | '1m'>('1w')
  const { data, isLoading, isError } = usePriceTrend(period)

  return (
    <SidebarCard>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>📊 가격 흐름</CardTitle>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {isLoading && <PriceTrendSkeleton />}

      {!isLoading && isError && (
        <ErrorMessage text="데이터를 불러올 수 없습니다" />
      )}

      {!isLoading && !isError && data && (
        data.transactionCount === 0 ? (
          <ErrorMessage text="최근 거래 데이터가 없어요" />
        ) : (
          <>
            <p className="mt-3 text-xs text-gray-400">평균 거래가</p>
            <p className="mt-0.5 text-xl font-bold text-gray-900">
              {formatPrice(data.avgPrice)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {data.transactionCount > 1 && <ChangeRateBadge rate={data.changeRate} />}
              <span className="text-xs text-gray-400">거래 {data.transactionCount}건</span>
            </div>
          </>
        )
      )}
    </SidebarCard>
  )
}
