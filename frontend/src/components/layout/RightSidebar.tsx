import { PopularPosts } from '../features/sidebar/PopularPosts'
import { MostCommentedPosts } from '../features/sidebar/MostCommentedPosts'
import { AdSlot } from '../features/ads/AdSlot'
import type { BoardCode, CommunityScope } from '../../types'

type Props = {
  scope: CommunityScope
  aptId: string
  boardCode: BoardCode
}

export const RightSidebar = ({ scope, aptId, boardCode }: Props) => (
  <div>
    <PopularPosts scope={scope} aptId={aptId} boardCode={boardCode} />
    <MostCommentedPosts scope={scope} aptId={aptId} boardCode={boardCode} />
    <AdSlot slot="RIGHT_SIDEBAR_MIDDLE" />
    <AdSlot slot="RIGHT_SIDEBAR_BOTTOM" />
  </div>
)
