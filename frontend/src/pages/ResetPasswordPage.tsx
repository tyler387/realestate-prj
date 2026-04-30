import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ServiceLogo } from '../components/features/auth/ServiceLogo'
import { authApi } from '../services/authService'
import { useUiStore } from '../stores/uiStore'

type Step = 'code' | 'password'

export const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const showToast = useUiStore((s) => s.showToast)

  // forgot-password 페이지에서 전달한 이메일을 이어받아 같은 사용자 흐름으로 진행한다.
  const emailFromState = (location.state as { email?: string } | null)?.email ?? ''
  const [email] = useState(emailFromState)

  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const isCodeValid = code.length === 6 && /^\d{6}$/.test(code)

  const passwordError = useMemo(() => {
    if (!newPassword) return ''
    if (newPassword.length < 8) return '비밀번호는 8자 이상이어야 해요'
    return ''
  }, [newPassword])

  const confirmError = useMemo(() => {
    if (!confirmPassword) return ''
    if (newPassword !== confirmPassword) return '비밀번호가 일치하지 않아요'
    return ''
  }, [newPassword, confirmPassword])

  const isPasswordSubmitEnabled =
    newPassword.length >= 8 && newPassword === confirmPassword

  const handleVerifyCode = async () => {
    // 1단계: 메일로 받은 6자리 코드를 서버에서 검증
    if (!isCodeValid || isLoading) return
    setServerError('')
    setIsLoading(true)
    try {
      await authApi.verifyResetToken(email, code)
      setStep('password')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '인증에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmReset = async () => {
    // 2단계: 새 비밀번호를 저장하고 로그인 페이지로 이동
    if (!isPasswordSubmitEnabled || isLoading) return
    setServerError('')
    setIsLoading(true)
    try {
      await authApi.confirmPasswordReset(email, code, newPassword)
      showToast('비밀번호가 변경되었어요', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 pt-6">
      <ServiceLogo />

      {step === 'code' ? (
        <>
          <h2 className="mb-2 text-xl font-bold text-gray-900">인증코드 입력</h2>
          <p className="mb-6 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{email}</span> 으로 발송된
            6자리 인증코드를 입력해주세요
          </p>

          <label className="text-sm font-medium text-gray-700">인증코드</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            placeholder="6자리 숫자"
            className="mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 text-center text-lg font-semibold tracking-widest outline-none focus:border-blue-500"
          />
          {serverError && <p className="mt-3 text-sm text-red-500">{serverError}</p>}

          <button
            onClick={handleVerifyCode}
            disabled={!isCodeValid || isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {isLoading
              ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : '확인'}
          </button>

          <button
            onClick={() => navigate('/forgot-password')}
            className="mt-4 text-center text-sm text-gray-500"
          >
            인증코드 다시 받기
          </button>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-xl font-bold text-gray-900">새 비밀번호 설정</h2>
          <p className="mb-6 text-sm text-gray-500">새로 사용할 비밀번호를 입력해주세요</p>

          <label className="text-sm font-medium text-gray-700">새 비밀번호</label>
          <div className="mt-2 flex h-12 items-center rounded-xl border border-gray-200 px-3">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="8자 이상 입력하세요"
              className="flex-1 text-sm outline-none"
            />
            <button
              onClick={() => setShowPassword((v) => !v)}
              className="w-10 text-gray-400"
              type="button"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}

          <label className="mt-4 text-sm font-medium text-gray-700">비밀번호 확인</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="비밀번호를 다시 입력하세요"
            className={`mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none ${
              confirmError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
            }`}
          />
          {confirmError && <p className="mt-1 text-xs text-red-500">{confirmError}</p>}
          {serverError && <p className="mt-3 text-sm text-red-500">{serverError}</p>}

          <button
            onClick={handleConfirmReset}
            disabled={!isPasswordSubmitEnabled || isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {isLoading
              ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : '비밀번호 변경'}
          </button>
        </>
      )}
    </div>
  )
}
