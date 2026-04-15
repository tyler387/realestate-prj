import { useUiStore }  from '../../../stores/uiStore'
import { PostCard }    from './PostCard'
import { EmptyState }  from '../../common/EmptyState'
import type { Post }   from '../../../types'

type PostListProps = {
  posts: Post[]
}

export const PostList = ({ posts }: PostListProps) => {
  const searchKeyword = useUiStore((s) => s.searchKeyword)

  const filtered = posts.filter((p) =>
    searchKeyword
      ? p.title.includes(searchKeyword) || p.content.includes(searchKeyword)
      : true
  )

  if (filtered.length === 0) return <EmptyState message="게시글이 없습니다" />

  return (
    <div>
      {filtered.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
