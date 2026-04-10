import { PopularPosts } from '../features/sidebar/PopularPosts'
import { MostCommentedPosts } from '../features/sidebar/MostCommentedPosts'

export const RightSidebar = ({ aptId }: { aptId: string }) => (
  <div>
    <PopularPosts aptId={aptId} />
    <MostCommentedPosts aptId={aptId} />
  </div>
)
