import type { Comment } from '../../../types'

type Props = {
  comment: Comment
  isOwner: boolean
  onDelete: (commentId: number) => void
}

export const CommentItem = ({ comment, isOwner, onDelete }: Props) => (
  <div className="border-b border-gray-100 px-4 py-3">
    <div className="mb-1 flex items-center justify-between">
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span className="font-medium text-gray-600">{comment.authorNickname}</span>
        <span>·</span>
        <span>{comment.createdAt}</span>
      </div>
      {isOwner && (
        <button
          onClick={() => onDelete(comment.id)}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          삭제
        </button>
      )}
    </div>
    <p className="text-sm text-gray-700">{comment.content}</p>
  </div>
)
