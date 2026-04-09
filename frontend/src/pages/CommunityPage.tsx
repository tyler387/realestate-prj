import { CategoryFilter } from '../components/features/community/CategoryFilter'
import { SortDropdown } from '../components/features/community/SortDropdown'
import { PostList } from '../components/features/community/PostList'

export const CommunityPage = () => (
  <div className="flex flex-col pb-24">
    <CategoryFilter />
    <SortDropdown />
    <PostList />
  </div>
)
