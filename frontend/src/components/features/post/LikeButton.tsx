import type { Post } from '../../../types'
import { usePostStore } from '../../../stores/postStore'

type LikeButtonProps = {
  post: Post
  disabled?: boolean
  onDisabledClick?: () => void
}

export const LikeButton = ({ post, disabled = false, onDisabledClick }: LikeButtonProps) => {
  const toggleLike = usePostStore((s) => s.toggleLike)

  const handleClick = () => {
    if (disabled) {
      onDisabledClick?.()
      return
    }

    toggleLike(post.id)
  }

  return (
    <div className="flex justify-center border-b border-t border-gray-100 bg-white py-3">
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400'
            : post.liked
              ? 'border-red-300 bg-red-50 text-red-500'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}
      >
        <span>{post.liked && !disabled ? '❤️' : '🤍'}</span>
        <span>좋아요 {post.likeCount}</span>
      </button>
    </div>
  )
}
