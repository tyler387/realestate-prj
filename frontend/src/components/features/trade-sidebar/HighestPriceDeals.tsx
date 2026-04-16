import { useTradeFilterStore } from '../../../stores/tradeFilterStore'
import { useHighestPriceDeals } from '../../../hooks/useTradeSidebarData'
import { SidebarCard, CardTitle } from '../sidebar/SidebarCard'
import { PostListSkeleton, ErrorMessage } from '../sidebar/SidebarSkeleton'
import { HighestDealItem } from './HighestDealItem'

export const HighestPriceDeals = () => {
  const { setAptId } = useTradeFilterStore()
  const { data, isLoading, isError } = useHighestPriceDeals()

  return (
    <SidebarCard>
      <CardTitle>🔥 신고가 거래</CardTitle>

      {isLoading && <PostListSkeleton />}

      {!isLoading && isError && (
        <ErrorMessage text="데이터를 불러올 수 없습니다" />
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <ErrorMessage text="신고가 없음" />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        data.map((deal) => (
          <HighestDealItem
            key={`${deal.aptId}-${deal.dealDate}`}
            deal={deal}
            onClick={() => setAptId(deal.aptId)}
          />
        ))
      )}
    </SidebarCard>
  )
}
