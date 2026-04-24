export type { ApartmentMarker, MapBounds, Apartment } from './apartment'

export type Category = string
export type SortType = string
export type AuthStatus = 'GUEST' | 'MEMBER' | 'VERIFIED'

export type Post = {
  id: number
  aptId?: number
  category: string
  title: string
  content: string
  authorNickname: string
  complexName: string
  createdAt: string
  likeCount: number
  commentCount: number
  liked: boolean
}

export type Comment = {
  id: number
  postId: number
  authorNickname: string
  content: string
  createdAt: string
}

export type User = {
  userId: number | null
  nickname: string | null
  status: AuthStatus
  apartmentId: number | null
  apartmentName: string | null
}
