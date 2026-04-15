export type ApartmentSummary = {
  aptId:       string
  aptName:     string
  location:    string
  households:  number
  builtYear:   number
  recentPrice: number
}

export type PopularPost = {
  postId:       number
  title:        string
  likeCount:    number
  commentCount: number
}

export type MostCommentedPost = {
  postId:       number
  title:        string
  commentCount: number
}

// ── aptId별 mock 데이터 맵 ─────────────────────────────────────────

const summaryMap: Record<string, ApartmentSummary> = {
  '1': {
    aptId: '1', aptName: '잠실엘스',
    location: '서울 송파구 잠실동',
    households: 1678, builtYear: 2008, recentPrice: 235000,
  },
  '6': {
    aptId: '6', aptName: '헬리오시티',
    location: '서울 송파구 가락동',
    households: 9510, builtYear: 2018, recentPrice: 192000,
  },
  '7': {
    aptId: '7', aptName: '래미안퍼스티지',
    location: '서울 서초구 반포동',
    households: 2444, builtYear: 2009, recentPrice: 410000,
  },
  '8': {
    aptId: '8', aptName: '아크로리버파크',
    location: '서울 서초구 반포동',
    households: 1612, builtYear: 2016, recentPrice: 520000,
  },
  '9': {
    aptId: '9', aptName: '마포래미안푸르지오',
    location: '서울 마포구 아현동',
    households: 3885, builtYear: 2014, recentPrice: 138000,
  },
}

const keywordsMap: Record<string, string[]> = {
  '1': ['관리비', '주차', '전세', '헬스장', '소음', '택배', '엘리베이터', '분리수거', '민원', '공지'],
  '6': ['주차난', '조경', '편의시설', '관리비', '헬스장', '어린이집', '소음', '경비'],
  '7': ['반포천', '한강뷰', '학군', '주차', '관리비', '인테리어', '전세', '매매'],
  '8': ['한강뷰', '고급', '보안', '주차', '관리비', '헬스장', '수영장', '커뮤니티'],
  '9': ['교통', '지하철', '주차', '관리비', '학교', '편의점', '소음', '배달'],
}

const popularPostsMap: Record<string, PopularPost[]> = {
  '1': [
    { postId: 1, title: '헬스장 이용 시간 변경되었나요?',     likeCount: 12, commentCount: 5 },
    { postId: 2, title: '관리비 고지서 확인하세요',            likeCount: 8,  commentCount: 3 },
    { postId: 3, title: '주차 문제 어떻게 생각하세요?',       likeCount: 7,  commentCount: 7 },
    { postId: 4, title: '택배 보관함 위치 아시는 분 계세요?',  likeCount: 5,  commentCount: 4 },
    { postId: 5, title: '분리수거 요일 바뀌었어요',            likeCount: 4,  commentCount: 6 },
  ],
  '6': [
    { postId: 4, title: '헬리오시티 주차 문제 심각해요',       likeCount: 12, commentCount: 7 },
    { postId: 5, title: '헬리오시티 조경 너무 예쁘지 않나요',  likeCount: 25, commentCount: 11 },
    { postId: 6, title: '어린이집 대기 신청 방법 알려주세요',  likeCount: 9,  commentCount: 6 },
    { postId: 7, title: '편의시설 이용 시간 공지',             likeCount: 6,  commentCount: 2 },
    { postId: 8, title: '경비원 교대 시간 변경 안내',          likeCount: 3,  commentCount: 4 },
  ],
}

const mostCommentedMap: Record<string, MostCommentedPost[]> = {
  '1': [
    { postId: 7,  title: '엘리베이터 소음 민원 넣으신 분',        commentCount: 23 },
    { postId: 8,  title: '주차 자리 배정 방식 바꿔야 하지 않나요', commentCount: 18 },
    { postId: 3,  title: '주차 문제 어떻게 생각하세요?',           commentCount: 7  },
    { postId: 9,  title: '헬스장 회원 등록 어떻게 하나요',         commentCount: 6  },
    { postId: 10, title: '분리수거 요일 다들 알고 계신가요',        commentCount: 5  },
  ],
  '6': [
    { postId: 5,  title: '헬리오시티 조경 너무 예쁘지 않나요',     commentCount: 11 },
    { postId: 4,  title: '헬리오시티 주차 문제 심각해요',          commentCount: 7  },
    { postId: 6,  title: '어린이집 대기 신청 방법 알려주세요',      commentCount: 6  },
    { postId: 8,  title: '경비원 교대 시간 변경 안내',              commentCount: 4  },
    { postId: 7,  title: '편의시설 이용 시간 공지',                 commentCount: 2  },
  ],
}

// fallback (알 수 없는 aptId)
const defaultSummary: ApartmentSummary = {
  aptId: '', aptName: '아파트를 선택해주세요',
  location: '-', households: 0, builtYear: 0, recentPrice: 0,
}

export const getMockSummary        = (aptId: string) => summaryMap[aptId]          ?? defaultSummary
export const getMockKeywords       = (aptId: string) => keywordsMap[aptId]         ?? []
export const getMockPopularPosts   = (aptId: string) => popularPostsMap[aptId]     ?? []
export const getMockMostCommented  = (aptId: string) => mostCommentedMap[aptId]    ?? []
