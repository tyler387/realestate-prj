import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../../../stores/userStore'
import { fetchMyComments } from '../../../services/communityService'
import { EmptyState } from '../../common/EmptyState'

export const MyCommentList = () => {
  const nickname = useUserStore((s) => s.nickname)

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['community', 'my-comments', nickname],
    queryFn: () => fetchMyComments(nickname!),
    enabled: !!nickname,
  })

  if (isLoading) return <EmptyState message="불러오는 중..." />
  if (comments.length === 0) return <EmptyState icon="💬" title="아직 작성한 댓글이 없어요" />

  return (
    <div className="bg-white">
      {comments.map((comment) => (
        <div key={comment.id} className="border-b border-gray-100 px-4 py-3">
          <div className="mb-1 text-xs text-gray-400">{comment.createdAt}</div>
          <p className="text-sm text-gray-700">{comment.content}</p>
        </div>
      ))}
    </div>
  )
}
