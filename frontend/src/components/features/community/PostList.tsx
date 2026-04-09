import { usePostStore } from '../../../stores/postStore'
import { PostCard } from './PostCard'
import { EmptyState } from '../../common/EmptyState'

export const PostList = () => {
  const { posts, selectedCategory, sortType } = usePostStore()

  const filtered = posts
    .filter((p) => selectedCategory === '전체' || p.category === selectedCategory)
    .sort((a, b) => sortType === '인기순' ? b.likeCount - a.likeCount : b.id - a.id)

  if (filtered.length === 0) return <EmptyState message="게시글이 없습니다" />

  return (
    <div>
      {filtered.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
