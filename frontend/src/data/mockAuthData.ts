import type { AuthStatus } from '../types'

export const mockNicknames = [
  '익명_7823',
  '이웃_4521',
  '주민_9034',
  '입주민_3312',
  '동네_5678',
  '아파트_2290',
  '새벽_1122',
  '햇살_8877',
  '바람_3344',
]

export const mockUsedEmails = ['test@test.com', 'used@example.com']
export const mockUsedNicknames = ['익명_0000', '테스트유저']

export const mockLoginUser = {
  userId: 1,
  nickname: '익명_7823',
  status: 'MEMBER' as const,
  apartmentId: null,
  apartmentName: null,
}

export const mockWrongCredentials = {
  email: 'wrong@test.com',
  password: 'wrongpass',
}

export const mockTerms = {
  service: `제 1조 (목적)
이 약관은 동네톡(이하 "서비스")의 이용 조건 및 절차에 관한 사항을 규정합니다.

제 2조 (서비스 이용)
회원은 본 약관에 동의함으로써 서비스를 이용할 수 있습니다.`,
  privacy: `개인정보 처리방침
동네톡은 이용자의 개인정보를 소중히 여기며 관련 법령을 준수합니다.

수집 항목: 이메일, 닉네임, 거주 아파트 정보
수집 목적: 서비스 제공 및 본인 확인`,
  marketing: `마케팅 정보 수신 동의 (선택)
이벤트, 혜택, 신규 기능 안내 등의 마케팅 정보를 수신합니다.
동의하지 않아도 서비스 이용에 제한이 없습니다.`,
}

export const getRandomNickname = () =>
  mockNicknames[Math.floor(Math.random() * mockNicknames.length)]

export const statusLabel: Record<AuthStatus, string> = {
  GUEST: '비회원',
  MEMBER: '미인증 회원',
  VERIFIED: '인증 회원',
}
