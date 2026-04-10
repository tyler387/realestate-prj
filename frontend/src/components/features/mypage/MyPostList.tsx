import { usePostStore } from '../../../stores/postStore'
import { useUserStore } from '../../../stores/userStore'
import { PostCard } from '../community/PostCard'
import { EmptyState } from '../../common/EmptyState'

export const MyPostList = () => {
  const apartmentName = useUserStore((s) => s.apartmentName)
  const posts = usePostStore((s) => s.posts)
  const myPosts = posts.filter((post) => post.complexName === apartmentName)

  if (myPosts.length === 0) return <EmptyState message="작성한 게시글이 없습니다" />
  return <div>{myPosts.map((post) => <PostCard key={post.id} post={post} />)}</div>
}
