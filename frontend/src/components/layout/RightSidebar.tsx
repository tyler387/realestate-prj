import { PopularPosts } from '../features/sidebar/PopularPosts'
import { MostCommentedPosts } from '../features/sidebar/MostCommentedPosts'
import { AdSlot } from '../features/ads/AdSlot'

export const RightSidebar = ({ aptId }: { aptId: string }) => (
  <div>
    <PopularPosts aptId={aptId} />
    <MostCommentedPosts aptId={aptId} />
    <AdSlot slot="RIGHT_SIDEBAR_MIDDLE" />
    <AdSlot slot="RIGHT_SIDEBAR_BOTTOM" />
  </div>
)
