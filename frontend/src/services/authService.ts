export type AuthResponse = {
  token: string
  userId: number
  nickname: string
  status: 'MEMBER' | 'VERIFIED'
  apartmentId: number | null
  apartmentName: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export const tokenStorage = {
  get: (): string | null => localStorage.getItem('auth_token'),
  set: (token: string): void => { localStorage.setItem('auth_token', token) },
  remove: (): void => { localStorage.removeItem('auth_token') },
}

const authRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
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
    throw new Error(text || '요청에 실패했습니다.')
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
}
