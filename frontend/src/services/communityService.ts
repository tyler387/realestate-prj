import type { Comment, Post } from '../types'
import { tokenStorage } from './authService'

type CreatePostParams = {
  aptId: number
  category: string
  title: string
  content: string
  authorNickname: string
  complexName: string
}

export type LikeToggleResponse = {
  liked: boolean
  likeCount: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

const authHeaders = (): HeadersInit => {
  const token = tokenStorage.get()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || '커뮤니티 API 요청에 실패했습니다.')
  }
  return (await response.json()) as T
}

const requestVoid = async (path: string, init?: RequestInit): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'API 요청에 실패했습니다.')
  }
}

export const fetchPosts = async (
  aptId: number | null,
  category: string,
  sortType: string,
): Promise<Post[]> => {
  if (aptId == null) return []
  const params = new URLSearchParams({
    aptId: String(aptId),
    category: category === '전체' ? '' : category,
    sortType,
  })
  return requestJson<Post[]>(`/api/community/posts?${params.toString()}`)
}

export const fetchPostById = async (id: number, nickname?: string | null): Promise<Post> => {
  const params = nickname ? `?nickname=${encodeURIComponent(nickname)}` : ''
  return requestJson<Post>(`/api/community/posts/${id}${params}`)
}

export const createPost = async (params: CreatePostParams): Promise<Post> =>
  requestJson<Post>('/api/community/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

export const fetchComments = async (postId: number): Promise<Comment[]> =>
  requestJson<Comment[]>(`/api/community/posts/${postId}/comments`)

export const createComment = async (
  postId: number,
  authorNickname: string,
  content: string,
  authorAptId?: number | null,
  authorAptName?: string | null,
): Promise<Comment> =>
  requestJson<Comment>(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorNickname, authorAptId: authorAptId ?? null, authorAptName: authorAptName ?? null, content }),
  })

export const deletePost = async (postId: number, authorNickname: string): Promise<void> => {
  const params = new URLSearchParams({ authorNickname })
  return requestVoid(`/api/community/posts/${postId}?${params}`, { method: 'DELETE' })
}

export const deleteComment = async (commentId: number, authorNickname: string): Promise<void> => {
  const params = new URLSearchParams({ authorNickname })
  return requestVoid(`/api/community/comments/${commentId}?${params}`, { method: 'DELETE' })
}

export const toggleLike = async (
  postId: number,
  authorNickname: string,
): Promise<LikeToggleResponse> =>
  requestJson<LikeToggleResponse>(`/api/community/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorNickname }),
  })

export const fetchMyPosts = async (nickname: string): Promise<Post[]> =>
  requestJson<Post[]>(`/api/community/my/posts?${new URLSearchParams({ nickname })}`)

export const fetchMyComments = async (nickname: string): Promise<Comment[]> =>
  requestJson<Comment[]>(`/api/community/my/comments?${new URLSearchParams({ nickname })}`)
