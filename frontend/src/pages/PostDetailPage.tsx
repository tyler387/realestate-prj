import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { PostContent } from '../components/features/post/PostContent'
import { LikeButton } from '../components/features/post/LikeButton'
import { CommentList } from '../components/features/post/CommentList'
import { CommentInput } from '../components/features/post/CommentInput'
import { useUserStore } from '../stores/userStore'
import { LoginRequiredCommentInput } from '../components/common/LoginRequiredCommentInput'
import { useUiStore } from '../stores/uiStore'
import { fetchPostById } from '../services/communityService'

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const status = useUserStore((s) => s.status)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)

  const postId = Number(id)
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['community', 'post', postId],
    queryFn: () => fetchPostById(postId),
    enabled: Number.isFinite(postId),
    staleTime: 1000 * 60 * 5,
  })

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    if (!post) return
    setLiked(post.liked)
    setLikeCount(post.likeCount)
  }, [post])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">게시글을 불러오는 중입니다</p>
      </div>
    )
  }

  if (isError || !post) {
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
      <LikeButton
        post={{ ...post, liked, likeCount }}
        disabled={!isVerified}
        onDisabledClick={openAuthSheet}
        onToggle={() => {
          setLiked((prevLiked) => {
            setLikeCount((prevCount) => (prevLiked ? prevCount - 1 : prevCount + 1))
            return !prevLiked
          })
        }}
      />
      <CommentList comments={[]} />
      {isVerified ? (
        <CommentInput />
      ) : (
        <LoginRequiredCommentInput userStatus={sheetStatus} onClick={openAuthSheet} />
      )}
    </div>
  )
}
