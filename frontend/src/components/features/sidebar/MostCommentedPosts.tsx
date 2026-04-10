import { useMostCommentedPosts } from '../../../hooks/useSidebarData'
import { SidebarCard, CardTitle } from './SidebarCard'
import { PostListSkeleton, ErrorMessage } from './SidebarSkeleton'
import { CommentedPostItem } from './CommentedPostItem'

export const MostCommentedPosts = ({ aptId }: { aptId: string }) => {
  const { data, isLoading, isError } = useMostCommentedPosts(aptId)

  return (
    <SidebarCard>
      <CardTitle>💬 댓글 많은 글</CardTitle>
      {isLoading && <PostListSkeleton />}
      {isError && <ErrorMessage text="데이터를 불러올 수 없습니다" />}
      {data?.map((post) => (
        <CommentedPostItem key={post.postId} post={post} />
      ))}
    </SidebarCard>
  )
}
