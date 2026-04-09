import type { Comment } from '../../../types'

export const CommentItem = ({ comment }: { comment: Comment }) => (
  <div className="border-b border-gray-100 px-4 py-3">
    <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
      <span className="font-medium text-gray-600">{comment.complexName}_익명</span>
      <span>·</span>
      <span>{comment.createdAt}</span>
    </div>
    <p className="text-sm text-gray-700">{comment.content}</p>
  </div>
)
