import { type TradeRanking } from '../../../data/mockTradeData'
import { TradeRankingCard } from './TradeRankingCard'
import { TradeRankingCardSkeleton } from './TradeRankingCardSkeleton'

type Props = {
  rankings: TradeRanking[]
  isLoading: boolean
}

export const TradeRankingList = ({ rankings, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <TradeRankingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {rankings.slice(0, 20).map((r) => (
        <TradeRankingCard key={r.apartmentId} ranking={r} />
      ))}
    </div>
  )
}
