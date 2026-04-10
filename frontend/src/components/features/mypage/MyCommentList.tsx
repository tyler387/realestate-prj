import { mockComments } from '../../../data/mockData'
import { CommentItem } from '../post/CommentItem'
import { EmptyState } from '../../common/EmptyState'
import { useUserStore } from '../../../stores/userStore'

export const MyCommentList = () => {
  const apartmentName = useUserStore((s) => s.apartmentName)
  const myComments = mockComments.filter((comment) => comment.complexName === apartmentName)

  if (myComments.length === 0) return <EmptyState message="작성한 댓글이 없습니다" />
  return <div>{myComments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}</div>
}
