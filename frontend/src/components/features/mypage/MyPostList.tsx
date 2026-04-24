import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../../../stores/userStore'
import { fetchMyPosts } from '../../../services/communityService'
import { EmptyState } from '../../common/EmptyState'

export const MyPostList = () => {
  const nickname = useUserStore((s) => s.nickname)
  const navigate = useNavigate()

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community', 'my-posts', nickname],
    queryFn: () => fetchMyPosts(nickname!),
    enabled: !!nickname,
  })

  if (isLoading) return <EmptyState message="불러오는 중..." />
  if (posts.length === 0) return <EmptyState icon="📝" title="아직 작성한 게시글이 없어요" />

  return (
    <div className="bg-white">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => navigate(`/community/post/${post.id}`)}
          className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
        >
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
            <span>{post.category}</span>
            <span>·</span>
            <span>{post.createdAt}</span>
          </div>
          <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.title}</p>
          <div className="mt-1 flex gap-2 text-xs text-gray-400">
            <span>❤️ {post.likeCount}</span>
            <span>💬 {post.commentCount}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
