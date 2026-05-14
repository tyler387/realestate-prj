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
  // 紐⑤뱺 ?몄쬆 API ?붿껌?????⑥닔瑜?怨듯넻 ?ъ슜?쒕떎.
  // ?ㅽ뙣 ???쒕쾭 硫붿떆吏瑜?理쒕???洹몃?濡??붾㈃???꾨떖???ъ슜?먭? ?댁쑀瑜??????덇쾶 ?쒕떎.
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
    let message = '?붿껌???ㅽ뙣?덉뒿?덈떎.'
    try {
      const json = JSON.parse(text)
      message = json.message || json.error || message
    } catch {}
    if (response.status === 401 && message.toLowerCase() === 'unauthorized') {
      message = '로그인이 만료되었어요. 다시 로그인해주세요.'
    }
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

  // ?꾩옱 鍮꾨?踰덊샇瑜?寃利앺븳 ????鍮꾨?踰덊샇濡?蹂寃?(JWT ?꾩슂)
  changePassword: (currentPassword: string, newPassword: string) =>
    authRequest<void>('/api/auth/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStorage.get() ?? ''}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // 寃뚯떆湲쨌?볤????듬챸 泥섎━????怨꾩젙????젣 (JWT ?꾩슂)
  deleteAccount: () =>
    authRequest<void>('/api/auth/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStorage.get() ?? ''}` },
    }),
}

