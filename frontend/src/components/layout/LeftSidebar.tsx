import { ApartmentInfoCard } from '../features/sidebar/ApartmentInfoCard'
import { TrendingKeywords } from '../features/sidebar/TrendingKeywords'
import { ApartmentSearchTrigger } from '../features/apartment-select/ApartmentSearchTrigger'
import type { BoardCode, CommunityScope } from '../../types'

type Props = {
  scope: CommunityScope
  aptId: string
  boardCode: BoardCode
}

export const LeftSidebar = ({ scope, aptId, boardCode }: Props) => (
  <div>
    {scope === 'APARTMENT' && (
      <>
        <ApartmentSearchTrigger />
        <ApartmentInfoCard aptId={aptId} />
      </>
    )}
    <TrendingKeywords scope={scope} aptId={aptId} boardCode={boardCode} />
  </div>
)
