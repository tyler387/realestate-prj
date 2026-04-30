import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServiceLogo } from '../components/features/auth/ServiceLogo'
import { authApi } from '../services/authService'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const emailError = useMemo(() => {
    if (!emailTouched) return ''
    if (!email.trim()) return '이메일을 입력해주세요'
    if (!emailRegex.test(email)) return '올바른 이메일 형식이 아니에요'
    return ''
  }, [email, emailTouched])

  const isSubmitEnabled = emailRegex.test(email)

  const handleSubmit = async () => {
    if (!isSubmitEnabled || isLoading) return
    setServerError('')
    setIsLoading(true)
    try {
      await authApi.requestPasswordReset(email)
      navigate('/reset-password', { state: { email } })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '요청에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 pt-6">
      <ServiceLogo />

      <h2 className="mb-2 text-xl font-bold text-gray-900">비밀번호 찾기</h2>
      <p className="mb-6 text-sm text-gray-500">
        가입한 이메일 주소를 입력하면 인증코드를 보내드려요
      </p>

      <label className="text-sm font-medium text-gray-700">이메일</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setEmailTouched(true)}
        autoComplete="email"
        inputMode="email"
        placeholder="이메일을 입력하세요"
        className={`mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none ${
          emailError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
        }`}
      />
      {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
      {serverError && <p className="mt-3 text-sm text-red-500">{serverError}</p>}

      <button
        onClick={handleSubmit}
        disabled={!isSubmitEnabled || isLoading}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isLoading
          ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          : '인증코드 받기'}
      </button>

      <button
        onClick={() => navigate('/login')}
        className="mt-4 text-center text-sm text-gray-500"
      >
        로그인으로 돌아가기
      </button>
    </div>
  )
}
