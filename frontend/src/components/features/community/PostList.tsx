import { PostCard } from './PostCard'
import { EmptyState } from '../../common/EmptyState'
import type { Post } from '../../../types'

type PostListProps = {
  posts: Post[]
}

export const PostList = ({ posts }: PostListProps) => {
  if (posts.length === 0) return <EmptyState message="게시글이 없습니다" />

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
