import { useNavigate } from 'react-router-dom'
import { usePopularPosts } from '../../../hooks/useSidebarData'
import { usePostStore } from '../../../stores/postStore'
import { SidebarCard } from './SidebarCard'
import { ErrorMessage, PostListSkeleton, SidebarEmptyState } from './SidebarSkeleton'
import { PopularPostItem } from './PopularPostItem'
import type { BoardCode, CommunityScope } from '../../../types'

type Props = {
  scope: CommunityScope
  aptId: string
  boardCode: BoardCode
}

export const PopularPosts = ({ scope, aptId, boardCode }: Props) => {
  const { data, isLoading, isError } = usePopularPosts(scope, aptId, boardCode)
  const navigate = useNavigate()
  const setSortType = usePostStore((state) => state.setSortType)
  const posts = data ?? []

  const handleMoreClick = () => {
    setSortType('POPULAR')
    navigate('/')
  }

  return (
    <SidebarCard className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-700">인기글</h3>
        {posts.length > 0 && (
          <button
            type="button"
            onClick={handleMoreClick}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            더보기
          </button>
        )}
      </div>

      {isLoading && <PostListSkeleton />}
      {isError && <ErrorMessage text="인기글을 불러올 수 없습니다" />}
      {!isLoading && !isError && posts.length === 0 && (
        <SidebarEmptyState text="아직 인기글이 없습니다" />
      )}
      {!isError && posts.map((post, i) => (
        <PopularPostItem key={post.postId} rank={i + 1} post={post} />
      ))}
    </SidebarCard>
  )
}
