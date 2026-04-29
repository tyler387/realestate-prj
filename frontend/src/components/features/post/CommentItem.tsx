import { useState } from 'react'
import type { Comment } from '../../../types'
import { ConfirmDialog } from '../../common/ConfirmDialog'

type Props = {
  comment: Comment
  isOwner: boolean
  onDelete: (commentId: number) => void
}

export const CommentItem = ({ comment, isOwner, onDelete }: Props) => {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="border-b border-gray-100 px-4 py-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="font-medium text-gray-600">{comment.authorNickname}</span>
          {comment.authorAptName && (
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
              {comment.authorAptName}
            </span>
          )}
          <span>·</span>
          <span>{comment.createdAt}</span>
        </div>
        {isOwner && (
          <button onClick={() => setShowConfirm(true)} className="text-xs text-gray-400 hover:text-red-500">
            삭제
          </button>
        )}
      </div>
      <p className="text-sm text-gray-700">{comment.content}</p>
      {showConfirm && (
        <ConfirmDialog
          message="댓글을 삭제하시겠습니까?"
          onConfirm={() => { setShowConfirm(false); onDelete(comment.id) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
