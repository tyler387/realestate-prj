import { useMostCommentedPosts } from '../../../hooks/useSidebarData'
import { SidebarCard } from './SidebarCard'
import { PostListSkeleton, ErrorMessage } from './SidebarSkeleton'
import { CommentedPostItem } from './CommentedPostItem'
import type { BoardCode, CommunityScope } from '../../../types'

type Props = {
  scope: CommunityScope
  aptId: string
  boardCode: BoardCode
}

export const MostCommentedPosts = ({ scope, aptId, boardCode }: Props) => {
  const { data, isLoading, isError } = useMostCommentedPosts(scope, aptId, boardCode)

  return (
    <SidebarCard className="p-4 lg:p-5">
      <h3 className="mb-3 text-sm font-bold text-gray-700">댓글 많은 글</h3>
      {isLoading && <PostListSkeleton />}
      {isError && <ErrorMessage text="데이터를 불러올 수 없습니다" />}
      {data?.map((post, i) => (
        <CommentedPostItem key={post.postId} rank={i + 1} post={post} />
      ))}
    </SidebarCard>
  )
}
