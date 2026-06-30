import { useNavigate } from 'react-router-dom'
import { useMostCommentedPosts } from '../../../hooks/useSidebarData'
import { usePostStore } from '../../../stores/postStore'
import { SidebarCard } from './SidebarCard'
import { ErrorMessage, PostListSkeleton, SidebarEmptyState } from './SidebarSkeleton'
import { CommentedPostItem } from './CommentedPostItem'
import type { BoardCode, CommunityScope } from '../../../types'

type Props = {
  scope: CommunityScope
  aptId: string
  boardCode: BoardCode
}

export const MostCommentedPosts = ({ scope, aptId, boardCode }: Props) => {
  const { data, isLoading, isError } = useMostCommentedPosts(scope, aptId, boardCode)
  const navigate = useNavigate()
  const setSortType = usePostStore((state) => state.setSortType)
  const posts = data ?? []

  const handleMoreClick = () => {
    setSortType('COMMENT')
    navigate('/')
  }

  return (
    <SidebarCard className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-700">댓글 많은 글</h3>
        {posts.length > 0 && (
          <button
            type="button"
            onClick={handleMoreClick}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            더보기
          </button>
        )}
      </div>

      {isLoading && <PostListSkeleton />}
      {isError && <ErrorMessage text="댓글 많은 글을 불러올 수 없습니다" />}
      {!isLoading && !isError && posts.length === 0 && (
        <SidebarEmptyState text="아직 댓글 많은 글이 없습니다" />
      )}
      {!isError && posts.map((post, i) => (
        <CommentedPostItem key={post.postId} rank={i + 1} post={post} />
      ))}
    </SidebarCard>
  )
}
