import type { Post } from '../../../types'
import { usePostStore } from '../../../stores/postStore'

export const LikeButton = ({ post }: { post: Post }) => {
  const toggleLike = usePostStore((s) => s.toggleLike)

  return (
    <div className="flex justify-center border-b border-t border-gray-100 bg-white py-3">
      <button
        onClick={() => toggleLike(post.id)}
        className={`flex items-center gap-1.5 rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
          post.liked ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}
      >
        <span>{post.liked ? '❤️' : '🤍'}</span>
        <span>좋아요 {post.likeCount}</span>
      </button>
    </div>
  )
}
