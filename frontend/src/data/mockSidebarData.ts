export type ApartmentSummary = {
  aptId: string
  aptName: string
  location: string
  households: number
  builtYear: number
  recentPrice: number
}

export type PopularPost = {
  postId: number
  title: string
  likeCount: number
  commentCount: number
}

export type MostCommentedPost = {
  postId: number
  title: string
  commentCount: number
}

export const mockApartmentSummary: ApartmentSummary = {
  aptId: 'apt-001',
  aptName: '잠실엘스',
  location: '서울 송파구 잠실동',
  households: 1678,
  builtYear: 2008,
  recentPrice: 235000,
}

export const mockTrendingKeywords: string[] = [
  '관리비', '주차', '전세', '헬스장',
  '소음', '택배', '엘리베이터', '분리수거',
  '민원', '공지',
]

export const mockPopularPosts: PopularPost[] = [
  { postId: 1, title: '헬스장 이용 시간 변경되었나요?',     likeCount: 12, commentCount: 5 },
  { postId: 2, title: '관리비 고지서 확인하세요',            likeCount: 8,  commentCount: 3 },
  { postId: 3, title: '주차 문제 어떻게 생각하세요?',       likeCount: 7,  commentCount: 7 },
  { postId: 4, title: '택배 보관함 위치 아시는 분 계세요?',  likeCount: 5,  commentCount: 4 },
  { postId: 5, title: '분리수거 요일 바뀌었어요',            likeCount: 4,  commentCount: 6 },
]

export const mockMostCommentedPosts: MostCommentedPost[] = [
  { postId: 7,  title: '엘리베이터 소음 민원 넣으신 분',        commentCount: 23 },
  { postId: 8,  title: '주차 자리 배정 방식 바꿔야 하지 않나요', commentCount: 18 },
  { postId: 3,  title: '주차 문제 어떻게 생각하세요?',           commentCount: 7  },
  { postId: 9,  title: '헬스장 회원 등록 어떻게 하나요',         commentCount: 6  },
  { postId: 10, title: '분리수거 요일 다들 알고 계신가요',        commentCount: 5  },
]
