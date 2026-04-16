import { type TopApartment } from '../../../types/trade'
import { TradeRankingCard } from './TradeRankingCard'
import { TradeRankingCardSkeleton } from './TradeRankingCardSkeleton'

type Props = {
  rankings: TopApartment[]
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
      {rankings.map((r) => (
        <TradeRankingCard key={r.aptId} ranking={r} />
      ))}
    </div>
  )
}
