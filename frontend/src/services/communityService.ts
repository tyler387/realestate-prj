import type { Post } from '../types'

type CreatePostParams = {
  aptId: number
  category: string
  title: string
  content: string
  authorNickname: string
  complexName: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || '커뮤니티 API 요청에 실패했습니다.')
  }
  return (await response.json()) as T
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

export const fetchPostById = async (id: number): Promise<Post> =>
  requestJson<Post>(`/api/community/posts/${id}`)

export const createPost = async (params: CreatePostParams): Promise<Post> =>
  requestJson<Post>('/api/community/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
