import type { Comment } from '../../../types'
import { CommentItem } from './CommentItem'
import { EmptyState } from '../../common/EmptyState'

export const CommentList = ({ comments }: { comments: Comment[] }) => (
  <div className="bg-white">
    <div className="border-b border-gray-100 px-4 py-3">
      <span className="text-sm font-semibold text-gray-700">댓글 {comments.length}개</span>
    </div>
    {comments.length === 0
      ? <EmptyState message="첫 댓글을 남겨보세요" />
      : comments.map((c) => <CommentItem key={c.id} comment={c} />)
    }
  </div>
)
