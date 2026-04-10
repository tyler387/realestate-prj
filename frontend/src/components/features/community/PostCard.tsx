import { useNavigate } from 'react-router-dom'
import type { Post } from '../../../types'
import { Badge } from '../../common/Badge'

export const PostCard = ({ post }: { post: Post }) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      className="cursor-pointer border-b border-gray-100 bg-white px-4 py-4 transition-colors hover:bg-gray-50"
    >
      <div className="mb-1.5">
        <Badge label={post.category} />
      </div>
      <h3 className="mb-1 line-clamp-1 text-base font-semibold text-gray-900">{post.title}</h3>
      <p className="mb-3 line-clamp-2 text-sm text-gray-700">{post.content}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{post.complexName}_익명 · {post.createdAt}</span>
        <div className="flex gap-3">
          <span>❤️ {post.likeCount}</span>
          <span>💬 {post.commentCount}</span>
        </div>
      </div>
    </div>
  )
}
