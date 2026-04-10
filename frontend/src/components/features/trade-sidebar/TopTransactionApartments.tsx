import { useTradeFilterStore } from '../../../stores/tradeFilterStore'
import { useTopTransactionApartments } from '../../../hooks/useTradeSidebarData'
import { SidebarCard, CardTitle } from '../sidebar/SidebarCard'
import { PostListSkeleton } from '../sidebar/SidebarSkeleton'
import { TopAptItem } from './TopAptItem'

export const TopTransactionApartments = () => {
  const { regionId, subRegionId, setAptId } = useTradeFilterStore()
  const { data, isLoading, isError } = useTopTransactionApartments(regionId, subRegionId)

  if (!isLoading && (isError || !data || data.length === 0)) return null

  return (
    <SidebarCard>
      <CardTitle>🏆 거래량 TOP5</CardTitle>

      {isLoading && <PostListSkeleton />}

      {!isLoading && data?.map((apt) => (
        <TopAptItem
          key={apt.aptId}
          apt={apt}
          onClick={() => setAptId(apt.aptId)}
        />
      ))}
    </SidebarCard>
  )
}
