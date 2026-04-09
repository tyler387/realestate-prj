import type { Post, Comment, User } from '../types'

export const mockUser: User = {
  id: 1,
  nickname: '잠실엘스_102동',
  complexName: '잠실엘스',
  verified: true,
}

export const mockPosts: Post[] = [
  {
    id: 1,
    category: '자유',
    title: '단지 내 주차 문제 어떻게 생각하세요?',
    content: '요즘 방문차량이 너무 많아서 거주자 주차 자리가 부족한 것 같아요. 다들 어떻게 생각하시나요?',
    authorNickname: '잠실엘스_102동',
    complexName: '잠실엘스',
    createdAt: '3시간 전',
    likeCount: 12,
    commentCount: 7,
    liked: false,
  },
  {
    id: 2,
    category: '정보',
    title: '관리비 고지서 오늘 나왔어요',
    content: '이번 달 관리비 고지서 나왔습니다. 엘리베이터 교체 공사로 인해 조금 올랐네요.',
    authorNickname: '잠실엘스_201동',
    complexName: '잠실엘스',
    createdAt: '5시간 전',
    likeCount: 8,
    commentCount: 3,
    liked: true,
  },
  {
    id: 3,
    category: '질문',
    title: '단지 내 헬스장 이용 시간 아시는 분?',
    content: '헬스장 운영 시간이 바뀐 것 같은데 혹시 아시는 분 계신가요?',
    authorNickname: '잠실엘스_305동',
    complexName: '잠실엘스',
    createdAt: '어제',
    likeCount: 3,
    commentCount: 5,
    liked: false,
  },
  {
    id: 4,
    category: '거래',
    title: '유모차 나눔합니다 (에어버기)',
    content: '아이가 커서 더 이상 사용하지 않는 유모차 나눔해요. 상태 매우 좋습니다.',
    authorNickname: '잠실엘스_401동',
    complexName: '잠실엘스',
    createdAt: '2일 전',
    likeCount: 15,
    commentCount: 9,
    liked: false,
  },
  {
    id: 5,
    category: '민원',
    title: '층간소음 신고 방법 알려주세요',
    content: '윗집에서 밤 11시 이후에도 뛰는 소리가 심한데 어디에 신고하면 되나요?',
    authorNickname: '잠실엘스_503동',
    complexName: '잠실엘스',
    createdAt: '3일 전',
    likeCount: 21,
    commentCount: 14,
    liked: false,
  },
]

export const mockComments: Comment[] = [
  {
    id: 1,
    authorNickname: '잠실엘스_201동',
    complexName: '잠실엘스',
    content: '맞아요, 저도 어제 주차 못 해서 한참 돌았어요.',
    createdAt: '2시간 전',
  },
  {
    id: 2,
    authorNickname: '잠실엘스_305동',
    complexName: '잠실엘스',
    content: '관리사무소에 건의해 보는 게 어떨까요?',
    createdAt: '1시간 전',
  },
  {
    id: 3,
    authorNickname: '잠실엘스_104동',
    complexName: '잠실엘스',
    content: '저번에도 같은 문제가 있었는데 결국 해결 안 됐어요...',
    createdAt: '30분 전',
  },
]

export const mockApartments = [
  { id: 1, name: '잠실엘스', address: '서울 송파구 잠실동 1', household: 5678 },
  { id: 2, name: '헬리오시티', address: '서울 송파구 가락동 99', household: 9510 },
  { id: 3, name: '리센츠', address: '서울 송파구 잠실동 17', household: 5563 },
  { id: 4, name: '트리지움', address: '서울 송파구 잠실동 19', household: 3696 },
  { id: 5, name: '잠실주공5단지', address: '서울 송파구 잠실동 15', household: 3930 },
]
