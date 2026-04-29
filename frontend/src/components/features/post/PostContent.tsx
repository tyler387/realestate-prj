import { useState } from 'react'
import type { Post } from '../../../types'
import { Badge } from '../../common/Badge'
import { ConfirmDialog } from '../../common/ConfirmDialog'

type Props = {
  post: Post
  isOwner?: boolean
  onDelete?: () => void
}

export const PostContent = ({ post, isOwner, onDelete }: Props) => {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="bg-white px-4 py-5">
      <div className="mb-2">
        <Badge label={post.category} />
      </div>
      <h2 className="mb-2 text-lg font-bold text-gray-900">{post.title}</h2>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="font-medium text-gray-600">{post.authorNickname}</span>
          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
            {post.complexName}
          </span>
          <span>·</span>
          <span>{post.createdAt}</span>
        </div>
        {isOwner && (
          <button onClick={() => setShowConfirm(true)} className="text-xs text-gray-400 hover:text-red-500">
            삭제
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed text-gray-700">{post.content}</p>
      {showConfirm && (
        <ConfirmDialog
          message="게시글을 삭제하시겠습니까?"
          onConfirm={() => { setShowConfirm(false); onDelete?.() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
