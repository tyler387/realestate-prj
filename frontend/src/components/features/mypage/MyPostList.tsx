import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '../../../stores/userStore'
import { fetchMyPosts, deletePost } from '../../../services/communityService'
import { EmptyState } from '../../common/EmptyState'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { useUiStore } from '../../../stores/uiStore'

export const MyPostList = () => {
  const nickname = useUserStore((s) => s.nickname)
  const navigate = useNavigate()
  const showToast = useUiStore((s) => s.showToast)
  const queryClient = useQueryClient()
  const [confirmPostId, setConfirmPostId] = useState<number | null>(null)

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community', 'my-posts', nickname],
    queryFn: () => fetchMyPosts(nickname!),
    enabled: !!nickname,
  })

  const deleteMutation = useMutation({
    mutationFn: (postId: number) => deletePost(postId, nickname!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'my-posts', nickname] })
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] })
      showToast('게시글이 삭제되었어요', 'info')
    },
    onError: () => showToast('게시글 삭제에 실패했습니다', 'error'),
  })

  if (isLoading) return <EmptyState message="불러오는 중..." />
  if (posts.length === 0) return <EmptyState icon="📝" title="아직 작성한 게시글이 없어요" />

  return (
    <div className="bg-white">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center border-b border-gray-100">
          <button
            onClick={() => navigate(`/post/${post.id}`)}
            className="flex-1 px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
              <span>{post.category}</span>
              <span>·</span>
              <span>{post.createdAt}</span>
            </div>
            <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.title}</p>
            <div className="mt-1 flex gap-2 text-xs text-gray-400">
              <span>❤️ {post.likeCount}</span>
              <span>💬 {post.commentCount}</span>
            </div>
          </button>
          <button
            onClick={() => setConfirmPostId(post.id)}
            className="px-4 py-3 text-xs text-gray-400 hover:text-red-500"
          >
            삭제
          </button>
        </div>
      ))}
      {confirmPostId !== null && (
        <ConfirmDialog
          message="게시글을 삭제하시겠습니까?"
          onConfirm={() => { deleteMutation.mutate(confirmPostId); setConfirmPostId(null) }}
          onCancel={() => setConfirmPostId(null)}
        />
      )}
    </div>
  )
}
