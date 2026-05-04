export type AuthResponse = {
  token: string
  userId: number
  nickname: string
  status: 'MEMBER' | 'VERIFIED'
  apartmentId: number | null
  apartmentName: string | null
  oauthProvider?: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export const tokenStorage = {
  get: (): string | null => localStorage.getItem('auth_token'),
  set: (token: string): void => { localStorage.setItem('auth_token', token) },
  remove: (): void => { localStorage.removeItem('auth_token') },
}

const authRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  // 모든 인증 API 요청이 이 함수를 공통 사용한다.
  // 실패 시 서버 메시지를 최대한 그대로 화면에 전달해 사용자가 이유를 알 수 있게 한다.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (response.status === 204) return undefined as T
  if (!response.ok) {
    const text = await response.text()
    let message = '요청에 실패했습니다.'
    try {
      const json = JSON.parse(text)
      message = json.message || json.error || message
    } catch {}
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export const authApi = {
  signup: (body: {
    email: string
    password: string
    nickname: string
    serviceAgreed: boolean
    privacyAgreed: boolean
    marketingAgreed: boolean
  }) =>
    authRequest<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (email: string, password: string) =>
    authRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    authRequest<void>('/api/auth/logout', { method: 'POST' }),

  checkEmail: (email: string) =>
    authRequest<{ available: boolean }>(
      `/api/auth/check-email?email=${encodeURIComponent(email)}`
    ),

  checkNickname: (nickname: string) =>
    authRequest<{ available: boolean }>(
      `/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`
    ),

  verify: (apartmentId: number, apartmentName: string) =>
    authRequest<AuthResponse>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ apartmentId, apartmentName }),
      headers: { Authorization: `Bearer ${tokenStorage.get() ?? ''}` },
    }),

  requestPasswordReset: (email: string) =>
    authRequest<void>('/api/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetToken: (email: string, token: string) =>
    authRequest<void>('/api/auth/password-reset/verify', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    }),

  confirmPasswordReset: (email: string, token: string, newPassword: string) =>
    authRequest<void>('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    }),

  kakaoLogin: (code: string, redirectUri: string) =>
    authRequest<AuthResponse>('/api/auth/oauth/kakao', {
      method: 'POST',
      body: JSON.stringify({ code, redirectUri }),
    }),

  // 현재 비밀번호를 검증한 뒤 새 비밀번호로 변경 (JWT 필요)
  changePassword: (currentPassword: string, newPassword: string) =>
    authRequest<void>('/api/auth/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStorage.get() ?? ''}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // 게시글·댓글을 익명 처리한 후 계정을 삭제 (JWT 필요)
  deleteAccount: () =>
    authRequest<void>('/api/auth/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStorage.get() ?? ''}` },
    }),
}
