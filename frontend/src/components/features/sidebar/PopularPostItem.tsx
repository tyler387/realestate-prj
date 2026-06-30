import { useNavigate } from 'react-router-dom'
import type { PopularPost } from '../../../types/sidebar'

type Props = { rank: number; post: PopularPost }

const stripTrailingSerial = (title: string) => title.replace(/\s*#\d+\s*$/, '').trim()

export const PopularPostItem = ({ rank, post }: Props) => {
  const navigate = useNavigate()
  const cleanedTitle = stripTrailingSerial(post.title)

  return (
    <button
      type="button"
      onClick={() => navigate(`/post/${post.postId}`)}
      className={`-mx-1 mb-1.5 flex w-full cursor-pointer items-start gap-2 rounded-lg border-b border-gray-100 px-1 py-2.5 text-left transition-colors last:mb-0 last:border-b-0 hover:bg-gray-50 ${
        rank <= 3 ? 'border-l-2 border-l-blue-300 pl-2' : ''
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          rank <= 3 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm text-gray-800"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {cleanedTitle}
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          <span>좋아요 {post.likeCount}</span>
          <span>댓글 {post.commentCount}</span>
          <span>{post.createdAt ?? '커뮤니티 인기'}</span>
        </div>
      </div>
    </button>
  )
}
