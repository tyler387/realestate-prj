import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '../../../stores/userStore'
import { fetchMyComments, deleteComment } from '../../../services/communityService'
import { EmptyState } from '../../common/EmptyState'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { useUiStore } from '../../../stores/uiStore'

export const MyCommentList = () => {
  const nickname = useUserStore((s) => s.nickname)
  const showToast = useUiStore((s) => s.showToast)
  const queryClient = useQueryClient()
  const [confirmCommentId, setConfirmCommentId] = useState<number | null>(null)

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['community', 'my-comments', nickname],
    queryFn: () => fetchMyComments(nickname!),
    enabled: !!nickname,
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId, nickname!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'my-comments', nickname] })
      showToast('댓글이 삭제되었어요', 'info')
    },
    onError: () => showToast('댓글 삭제에 실패했습니다', 'error'),
  })

  if (isLoading) return <EmptyState message="불러오는 중..." />
  if (comments.length === 0) return <EmptyState icon="💬" title="아직 작성한 댓글이 없어요" />

  return (
    <div className="bg-white">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-center border-b border-gray-100">
          <div className="flex-1 px-4 py-3">
            <div className="mb-1 text-xs text-gray-400">{comment.createdAt}</div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
          <button
            onClick={() => setConfirmCommentId(comment.id)}
            className="px-4 py-3 text-xs text-gray-400 hover:text-red-500"
          >
            삭제
          </button>
        </div>
      ))}
      {confirmCommentId !== null && (
        <ConfirmDialog
          message="댓글을 삭제하시겠습니까?"
          onConfirm={() => { deleteMutation.mutate(confirmCommentId); setConfirmCommentId(null) }}
          onCancel={() => setConfirmCommentId(null)}
        />
      )}
    </div>
  )
}
