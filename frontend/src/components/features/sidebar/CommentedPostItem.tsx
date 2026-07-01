import { useNavigate } from 'react-router-dom'
import type { MostCommentedPost } from '../../../types/sidebar'

type Props = {
  rank: number
  post: MostCommentedPost
}

const stripTrailingSerial = (title: string) => title.replace(/\s*#\d+\s*$/, '').trim()

export const CommentedPostItem = ({ rank, post }: Props) => {
  const navigate = useNavigate()
  const cleanedTitle = stripTrailingSerial(post.title)

  return (
    <button
      type="button"
      onClick={() => navigate(`/post/${post.postId}`)}
      className={`-mx-1 mb-1.5 flex w-full cursor-pointer items-start gap-2 rounded-lg border-b border-line-base px-1 py-2.5 text-left transition-colors last:mb-0 last:border-b-0 hover:bg-surface-soft ${
        rank <= 3 ? 'border-l-2 border-l-emerald-300 pl-2' : ''
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          rank <= 3 ? 'bg-emerald-600 text-white' : 'bg-surface-soft text-text-muted'
        }`}
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-medium text-text-body"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {cleanedTitle}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-subtle">
          <span>댓글 {post.commentCount}개</span>
          <span>{post.createdAt ?? '토론 활발'}</span>
        </div>
      </div>
    </button>
  )
}
