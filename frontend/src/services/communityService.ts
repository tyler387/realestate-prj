import type { BoardCode, Comment, CommunityScope, Post, PostPage } from '../types'
import { tokenStorage } from './authService'
import { toCommunitySearchQueryParam } from '../utils/communitySearch'

type CreatePostParams = {
  scope: CommunityScope
  boardCode: BoardCode
  aptId?: number | null
  category?: string
  title: string
  content: string
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
    throw new Error(await resolveErrorMessage(response, '커뮤니티 API 요청에 실패했습니다.'))
  }
  return (await response.json()) as T
}

const toPosts = (data: Post[] | PostPage): Post[] => {
  if (Array.isArray(data)) return data
  return data.content
}

const toPostPage = (data: Post[] | PostPage, page: number, size: number): PostPage => {
  if (!Array.isArray(data)) return data
  return {
    content: data,
    page,
    size,
    totalElements: data.length,
    totalPages: data.length === 0 ? 0 : 1,
    hasNext: false,
  }
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
    throw new Error(await resolveErrorMessage(response, 'API 요청에 실패했습니다.'))
  }
}

const resolveErrorMessage = async (response: Response, fallback: string) => {
  const text = await response.text()
  let message = text || fallback

  try {
    const json = JSON.parse(text) as { message?: string; error?: string }
    message = json.message || json.error || message
  } catch {}

  if (response.status === 401) {
    tokenStorage.remove()
    return '로그인이 만료되었어요. 다시 로그인해주세요.'
  }
  if (response.status === 403) {
    return message === 'Forbidden' ? '아파트 인증 후 이용할 수 있습니다.' : message
  }
  return message
}

export const fetchPosts = async (
  scope: CommunityScope,
  aptId: number | null,
  boardCode: BoardCode,
  sortType: string,
  searchKeyword?: string | null,
  page = 0,
  size = 20,
): Promise<Post[]> => {
  if (scope === 'APARTMENT' && aptId == null) {
    return []
  }
  const params = new URLSearchParams({
    scope,
    boardCode,
    sortType,
    page: String(page),
    size: String(size),
  })
  if (scope === 'APARTMENT' && aptId != null) params.set('aptId', String(aptId))
  const q = toCommunitySearchQueryParam(searchKeyword)
  if (q) params.set('q', q)
  const data = await requestJson<Post[] | PostPage>(`/api/community/posts?${params.toString()}`)
  return toPosts(data)
}

export const fetchPostPage = async (
  scope: CommunityScope,
  aptId: number | null,
  boardCode: BoardCode,
  sortType: string,
  searchKeyword?: string | null,
  page = 0,
  size = 20,
): Promise<PostPage> => {
  if (scope === 'APARTMENT' && aptId == null) {
    return {
      content: [],
      page,
      size,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
    }
  }
  const params = new URLSearchParams({
    scope,
    boardCode,
    sortType,
    page: String(page),
    size: String(size),
  })
  if (scope === 'APARTMENT' && aptId != null) params.set('aptId', String(aptId))
  const q = toCommunitySearchQueryParam(searchKeyword)
  if (q) params.set('q', q)
  const data = await requestJson<Post[] | PostPage>(`/api/community/posts?${params.toString()}`)
  return toPostPage(data, page, size)
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
  content: string,
): Promise<Comment> =>
  requestJson<Comment>(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

export const deletePost = async (postId: number): Promise<void> =>
  requestVoid(`/api/community/posts/${postId}`, { method: 'DELETE' })

export const deleteComment = async (commentId: number): Promise<void> =>
  requestVoid(`/api/community/comments/${commentId}`, { method: 'DELETE' })

export const toggleLike = async (postId: number): Promise<LikeToggleResponse> =>
  requestJson<LikeToggleResponse>(`/api/community/posts/${postId}/like`, {
    method: 'POST',
  })

export const fetchMyPosts = async (): Promise<Post[]> =>
  requestJson<Post[]>('/api/community/my/posts')

export const fetchMyComments = async (): Promise<Comment[]> =>
  requestJson<Comment[]>('/api/community/my/comments')
