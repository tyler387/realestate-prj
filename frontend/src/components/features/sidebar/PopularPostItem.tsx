import { useNavigate } from 'react-router-dom'
import type { PopularPost } from '../../../data/mockSidebarData'

type Props = { rank: number; post: PopularPost }

export const PopularPostItem = ({ rank, post }: Props) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/post/${post.postId}`)}
      className="-mx-1 flex cursor-pointer items-start gap-2 rounded border-b border-gray-100 px-1 py-2 transition-colors last:border-b-0 hover:bg-gray-50"
    >
      <span className={`mt-0.5 w-5 shrink-0 text-sm font-bold ${rank <= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-800">{post.title}</p>
        <div className="mt-0.5 flex gap-2">
          <span className="text-xs text-gray-400">❤️ {post.likeCount}</span>
          <span className="text-xs text-gray-400">💬 {post.commentCount}</span>
        </div>
      </div>
    </div>
  )
}
