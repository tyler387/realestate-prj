import { useParams } from 'react-router-dom'
import { usePostStore } from '../stores/postStore'
import { PostContent } from '../components/features/post/PostContent'
import { LikeButton } from '../components/features/post/LikeButton'
import { CommentList } from '../components/features/post/CommentList'
import { CommentInput } from '../components/features/post/CommentInput'
import { mockComments } from '../data/mockData'

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const posts = usePostStore((s) => s.posts)
  const post = posts.find((p) => p.id === Number(id))

  if (!post) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">게시글을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PostContent post={post} />
      <LikeButton post={post} />
      <CommentList comments={mockComments} />
      <CommentInput />
    </div>
  )
}
