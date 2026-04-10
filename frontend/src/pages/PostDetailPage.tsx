import { useParams } from 'react-router-dom'
import { usePostStore } from '../stores/postStore'
import { PostContent } from '../components/features/post/PostContent'
import { LikeButton } from '../components/features/post/LikeButton'
import { CommentList } from '../components/features/post/CommentList'
import { CommentInput } from '../components/features/post/CommentInput'
import { mockComments } from '../data/mockData'
import { useUserStore } from '../stores/userStore'
import { LoginRequiredCommentInput } from '../components/common/LoginRequiredCommentInput'
import { useUiStore } from '../stores/uiStore'

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const posts = usePostStore((s) => s.posts)
  const post = posts.find((p) => p.id === Number(id))
  const status = useUserStore((s) => s.status)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)

  if (!post) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">게시글을 찾을 수 없습니다</p>
      </div>
    )
  }

  const isVerified = status === 'VERIFIED'
  const sheetStatus = status === 'GUEST' ? 'GUEST' : 'MEMBER'

  return (
    <div className="flex flex-col pb-[72px]">
      <PostContent post={post} />
      <LikeButton post={post} disabled={!isVerified} onDisabledClick={openAuthSheet} />
      <CommentList comments={mockComments} />
      {isVerified ? (
        <CommentInput />
      ) : (
        <LoginRequiredCommentInput userStatus={sheetStatus} onClick={openAuthSheet} />
      )}
    </div>
  )
}
