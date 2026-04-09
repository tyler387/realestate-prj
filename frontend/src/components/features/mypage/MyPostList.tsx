import { usePostStore } from '../../../stores/postStore'
import { useUserStore } from '../../../stores/userStore'
import { PostCard } from '../community/PostCard'
import { EmptyState } from '../../common/EmptyState'

export const MyPostList = () => {
  const user = useUserStore((s) => s.user)
  const posts = usePostStore((s) => s.posts)
  const myPosts = posts.filter((p) => p.complexName === user?.complexName)

  if (myPosts.length === 0) return <EmptyState message="작성한 게시글이 없습니다" />
  return <div>{myPosts.map((p) => <PostCard key={p.id} post={p} />)}</div>
}
