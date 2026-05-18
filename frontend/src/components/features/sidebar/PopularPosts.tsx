import { usePopularPosts } from '../../../hooks/useSidebarData'
import { SidebarCard } from './SidebarCard'
import { PostListSkeleton, ErrorMessage } from './SidebarSkeleton'
import { PopularPostItem } from './PopularPostItem'

export const PopularPosts = ({ aptId }: { aptId: string }) => {
  const { data, isLoading, isError } = usePopularPosts(aptId)

  return (
    <SidebarCard className="p-4 lg:p-5">
      <h3 className="mb-3 text-sm font-bold text-gray-700">인기글</h3>
      {isLoading && <PostListSkeleton />}
      {isError && <ErrorMessage text="인기글을 불러올 수 없습니다" />}
      {data?.map((post, i) => (
        <PopularPostItem key={post.postId} rank={i + 1} post={post} />
      ))}
    </SidebarCard>
  )
}
