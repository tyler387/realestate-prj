import { useNavigate } from 'react-router-dom'
import type { MostCommentedPost } from '../../../types/sidebar'

export const CommentedPostItem = ({ post }: { post: MostCommentedPost }) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/post/${post.postId}`)}
      className="-mx-1 cursor-pointer rounded border-b border-gray-100 px-1 py-2 transition-colors last:border-b-0 hover:bg-gray-50"
    >
      <p className="truncate text-sm text-gray-800">{post.title}</p>
      <p className="mt-0.5 text-xs text-gray-400">💬 {post.commentCount}개</p>
    </div>
  )
}
