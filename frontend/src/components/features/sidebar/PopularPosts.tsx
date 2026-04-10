import { usePopularPosts } from '../../../hooks/useSidebarData'
import { SidebarCard, CardTitle } from './SidebarCard'
import { PostListSkeleton, ErrorMessage } from './SidebarSkeleton'
import { PopularPostItem } from './PopularPostItem'

export const PopularPosts = ({ aptId }: { aptId: string }) => {
  const { data, isLoading, isError } = usePopularPosts(aptId)

  return (
    <SidebarCard>
      <CardTitle>🏆 인기 글</CardTitle>
      {isLoading && <PostListSkeleton />}
      {isError && <ErrorMessage text="인기 글을 불러올 수 없습니다" />}
      {data?.map((post, i) => (
        <PopularPostItem key={post.postId} rank={i + 1} post={post} />
      ))}
    </SidebarCard>
  )
}
