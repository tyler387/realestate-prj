export type { ApartmentMarker, MapBounds } from './apartment'

export type Category = '전체' | '자유' | '질문' | '정보' | '민원' | '거래'
export type SortType = '최신순' | '인기순'

export type Post = {
  id: number
  category: Exclude<Category, '전체'>
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
  authorNickname: string
  complexName: string
  content: string
  createdAt: string
}

export type User = {
  id: number
  nickname: string
  complexName: string
  verified: boolean
}
