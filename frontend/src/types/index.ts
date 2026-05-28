export type { ApartmentMarker, MapBounds, Apartment } from './apartment'

export type Category = string
export type SortType = string
export type AuthStatus = 'GUEST' | 'MEMBER' | 'VERIFIED'
export type CommunityScope = 'GLOBAL' | 'APARTMENT'
export type GlobalBoardCode = 'BLAH' | 'REAL_ESTATE' | 'STOCK' | 'DATING'
export type ApartmentBoardCode = 'APT_ALL' | 'APT_FREE' | 'APT_QNA' | 'APT_INFO' | 'APT_TRADE' | 'APT_ISSUE'
export type BoardCode = GlobalBoardCode | ApartmentBoardCode

export type Post = {
  id: number
  aptId?: number
  boardScope?: CommunityScope
  boardCode?: BoardCode
  category: string
  title: string
  content: string
  authorNickname: string
  complexName: string
  authorVerifiedAptId?: number | null
  authorVerifiedAptName?: string | null
  authorVerificationLabel?: string | null
  createdAt: string
  likeCount: number
  commentCount: number
  liked: boolean
}

export type Comment = {
  id: number
  postId: number
  postTitle?: string | null
  postBoardScope?: CommunityScope | null
  postBoardCode?: BoardCode | null
  postCategory?: string | null
  authorNickname: string
  authorAptId?: number | null
  authorAptName?: string | null
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
