import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { PostContent } from '../components/features/post/PostContent'
import { LikeButton } from '../components/features/post/LikeButton'
import { CommentList } from '../components/features/post/CommentList'
import { CommentInput } from '../components/features/post/CommentInput'
import { useUserStore } from '../stores/userStore'
import { LoginRequiredCommentInput } from '../components/common/LoginRequiredCommentInput'
import { useUiStore } from '../stores/uiStore'
import {
  fetchPostById,
  fetchComments,
  createComment,
  deleteComment,
  toggleLike,
} from '../services/communityService'

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const status = useUserStore((s) => s.status)
  const nickname = useUserStore((s) => s.nickname)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)
  const showToast = useUiStore((s) => s.showToast)
  const queryClient = useQueryClient()

  const postId = Number(id)

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['community', 'post', postId],
    queryFn: () => fetchPostById(postId),
    enabled: Number.isFinite(postId),
    staleTime: 1000 * 60 * 5,
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['community', 'comments', postId],
    queryFn: () => fetchComments(postId),
    enabled: Number.isFinite(postId),
  })

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    if (!post) return
    setLiked(post.liked)
    setLikeCount(post.likeCount)
  }, [post])

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(postId, nickname!),
    onSuccess: (data) => {
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    },
    onError: () => showToast('좋아요 처리에 실패했습니다', 'error'),
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment(postId, nickname!, content),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', postId] }),
    onError: () => showToast('댓글 작성에 실패했습니다', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId, nickname!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', postId] }),
    onError: () => showToast('댓글 삭제에 실패했습니다', 'error'),
  })

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
          if (nickname) likeMutation.mutate()
        }}
      />
      <CommentList
        comments={comments}
        currentNickname={nickname}
        onDelete={(commentId) => deleteMutation.mutate(commentId)}
      />
      {isVerified ? (
        <CommentInput onSubmit={(content) => commentMutation.mutate(content)} />
      ) : (
        <LoginRequiredCommentInput userStatus={sheetStatus} onClick={openAuthSheet} />
      )}
    </div>
  )
}
