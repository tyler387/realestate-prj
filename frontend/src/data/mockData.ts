import type { Post, Comment, User } from '../types'

export const mockUser: User = {
  userId: 1,
  nickname: '익명_1024',
  status: 'VERIFIED',
  apartmentId: 1,
  apartmentName: '잠실엘스',
}

export const mockPosts: Post[] = [
  {
    id: 1,
    aptId: 1,
    category: '자유',
    title: '주차 문제 어떻게 생각하세요?',
    content: '요즘 방문 차량이 많아서 거주자 주차 공간이 부족한 것 같아요. 의견이 궁금해요.',
    authorNickname: '익명_1024',
    complexName: '잠실엘스',
    createdAt: '3시간 전',
    likeCount: 12,
    commentCount: 7,
    liked: false,
  },
  {
    id: 2,
    aptId: 1,
    category: '정보',
    title: '관리비 고지서 확인하세요',
    content: '이번 달 관리비가 인상되었습니다. 공용부 교체 공사로 인한 변동입니다.',
    authorNickname: '익명_2010',
    complexName: '잠실엘스',
    createdAt: '5시간 전',
    likeCount: 8,
    commentCount: 3,
    liked: true,
  },
  {
    id: 3,
    aptId: 1,
    category: '질문',
    title: '헬스장 이용 시간 변경되었나요?',
    content: '최근 운영 시간이 바뀐 것 같은데 공지 확인하신 분 계신가요?',
    authorNickname: '익명_3055',
    complexName: '잠실엘스',
    createdAt: '어제',
    likeCount: 3,
    commentCount: 5,
    liked: false,
  },
  {
    id: 4,
    aptId: 6,
    category: '민원',
    title: '헬리오시티 주차 문제 심각해요',
    content: '주차 공간이 턱없이 부족합니다. 관리사무소에 민원 넣으신 분 계신가요?',
    authorNickname: '익명_9012',
    complexName: '헬리오시티',
    createdAt: '3시간 전',
    likeCount: 12,
    commentCount: 7,
    liked: false,
  },
  {
    id: 5,
    aptId: 6,
    category: '자유',
    title: '헬리오시티 조경 너무 예쁘지 않나요',
    content: '봄이 되니 단지 내 꽃이 만발했네요. 산책하기 너무 좋아요.',
    authorNickname: '익명_8801',
    complexName: '헬리오시티',
    createdAt: '1일 전',
    likeCount: 25,
    commentCount: 11,
    liked: false,
  },
]

export const mockComments: Comment[] = [
  {
    id: 1,
    authorNickname: '익명_2010',
    complexName: '잠실엘스',
    content: '저도 같은 문제를 느끼고 있어요.',
    createdAt: '2시간 전',
  },
  {
    id: 2,
    authorNickname: '익명_3055',
    complexName: '잠실엘스',
    content: '관리사무소에 전달해보면 좋을 것 같아요.',
    createdAt: '1시간 전',
  },
  {
    id: 3,
    authorNickname: '익명_1044',
    complexName: '잠실엘스',
    content: '지난번에는 주차 스티커 재배부로 해결했었어요.',
    createdAt: '30분 전',
  },
]

export const mockApartments = [
  { id: 1, name: '잠실엘스', address: '서울 송파구 잠실동 1', household: 5678 },
  { id: 2, name: '리센츠', address: '서울 송파구 잠실동 99', household: 5563 },
  { id: 3, name: '파크리오', address: '서울 송파구 잠실동 17', household: 6864 },
  { id: 4, name: '헬리오시티', address: '서울 송파구 가락동 913', household: 9510 },
  { id: 5, name: '잠실주공5단지', address: '서울 송파구 잠실동 15', household: 3930 },
]
