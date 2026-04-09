import { mockComments } from '../../../data/mockData'
import { CommentItem } from '../post/CommentItem'
import { EmptyState } from '../../common/EmptyState'
import { useUserStore } from '../../../stores/userStore'

export const MyCommentList = () => {
  const user = useUserStore((s) => s.user)
  const myComments = mockComments.filter((c) => c.complexName === user?.complexName)

  if (myComments.length === 0) return <EmptyState message="작성한 댓글이 없습니다" />
  return <div>{myComments.map((c) => <CommentItem key={c.id} comment={c} />)}</div>
}
