import { useNavigate } from 'react-router-dom'
import type { Post } from '../../../types'
import { Badge } from '../../common/Badge'

export const PostCard = ({ post }: { post: Post }) => {
  const navigate = useNavigate()
  const verificationLabel = post.authorVerifiedAptName
    ? `인증 · ${post.authorVerifiedAptName}`
    : post.authorVerificationLabel ?? post.complexName

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      className="mx-4 mb-3 cursor-pointer rounded-xl border border-line-base bg-surface-base p-4 transition-all hover:border-brand-100 hover:bg-white hover:shadow-panel"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <Badge label={post.category} />
        <span className="shrink-0 text-xs font-medium text-text-subtle">{post.createdAt}</span>
      </div>
      <h3 className="mb-1.5 line-clamp-1 text-base font-bold text-text-strong">{post.title}</h3>
      <p className="mb-4 line-clamp-2 text-sm leading-6 text-text-body">{post.content}</p>
      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-semibold text-text-body">{post.authorNickname}</span>
          <span className="shrink-0 rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            {verificationLabel}
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-3 tabular-nums">
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-6 0v4M5 12h14l-1.5 8.5a2 2 0 01-2 1.5H8.5a2 2 0 01-2-1.5L5 12z" />
            </svg>
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m8-2a9 9 0 11-4.22-7.63L21 4l-1.28 4.22A8.96 8.96 0 0121 12z" />
            </svg>
            {post.commentCount}
          </span>
        </div>
      </div>
    </div>
  )
}
