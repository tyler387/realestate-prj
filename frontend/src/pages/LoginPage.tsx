import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ServiceLogo } from '../components/features/auth/ServiceLogo'
import { authApi, tokenStorage } from '../services/authService'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useUserStore((s) => s.setUser)
  const showToast = useUiStore((s) => s.showToast)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const emailError = useMemo(() => {
    if (!emailTouched) return ''
    if (!email.trim()) return '이메일을 입력해주세요'
    if (!emailRegex.test(email)) return '올바른 이메일 형식이 아니에요'
    return ''
  }, [email, emailTouched])

  const isSubmitEnabled = email.length > 0 && password.length > 0

  const handleSubmit = async () => {
    if (!isSubmitEnabled || isLoading) return
    setServerError('')
    setIsLoading(true)

    try {
      const res = await authApi.login(email, password)
      tokenStorage.set(res.token)
      setUser({
        userId:                res.userId,
        nickname:              res.nickname,
        status:                res.status,
        apartmentId:           res.apartmentId,
        apartmentName:         res.apartmentName,
        verifiedApartmentId:   res.status === 'VERIFIED' ? res.apartmentId   : null,
        verifiedApartmentName: res.status === 'VERIFIED' ? res.apartmentName : null,
        oauthProvider:         res.oauthProvider ?? null,
      })
      const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo
      showToast('로그인 되었어요 👋', 'success')
      navigate(redirectTo || '/', { replace: true })
    } catch {
      setServerError('이메일 또는 비밀번호가 올바르지 않아요')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 pb-6 pt-6">
      <ServiceLogo />

      <div>
        <label className="text-sm font-medium text-gray-700">이메일</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setEmailTouched(true)}
          autoComplete="email"
          inputMode="email"
          placeholder="이메일을 입력하세요"
          className={`mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none ${
            emailError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
          }`}
        />
        {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-gray-700">비밀번호</label>
        <div className="mt-2 flex h-12 items-center rounded-xl border border-gray-200 px-3">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
            className="flex-1 text-sm outline-none"
          />
          <button onClick={() => setShowPassword((value) => !value)} className="w-10 text-gray-400" type="button">
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      {serverError && <p className="mt-4 text-sm text-red-500">{serverError}</p>}

      <button
        onClick={handleSubmit}
        disabled={!isSubmitEnabled || isLoading}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : '로그인'}
      </button>

      <button
        onClick={() => navigate('/forgot-password')}
        className="mt-4 text-center text-sm text-gray-500"
      >
        비밀번호를 잊으셨나요?
      </button>

      <div className="my-5 flex items-center gap-3 text-sm text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        <span>또는</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        onClick={() => {
          // 카카오 인증 페이지로 이동: 성공 시 /auth/kakao/callback 으로 돌아온다.
          const redirectUri = `${window.location.origin}/auth/kakao/callback`
          window.location.href =
            `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_KAKAO_REST_API_KEY}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
        }}
        className="h-12 w-full rounded-xl bg-[#FEE500] text-sm font-medium text-[#191919]"
      >
        카카오로 시작하기
      </button>
      <button
        onClick={() => showToast('준비 중인 기능이에요', 'info')}
        className="mt-3 h-12 w-full rounded-xl bg-black text-sm font-medium text-white"
      >
        Apple로 시작하기
      </button>

      <div className="mt-6 flex items-center justify-center gap-1">
        <span className="text-sm text-gray-500">계정이 없으신가요?</span>
        <button onClick={() => navigate('/signup')} className="text-sm font-semibold text-blue-500">
          회원가입
        </button>
      </div>
    </div>
  )
}
