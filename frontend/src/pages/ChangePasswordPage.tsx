import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServiceLogo } from '../components/features/auth/ServiceLogo'
import { authApi } from '../services/authService'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

export const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const showToast = useUiStore((s) => s.showToast)
  const oauthProvider = useUserStore((s) => s.oauthProvider)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  // 소셜 계정이 직접 URL로 진입한 경우 마이페이지로 돌려보낸다
  useEffect(() => {
    if (oauthProvider) {
      showToast('소셜 계정은 비밀번호를 변경할 수 없어요', 'error')
      navigate('/mypage', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newPasswordError = useMemo(() => {
    if (!newPassword) return ''
    if (newPassword.length < 8) return '비밀번호는 8자 이상이어야 해요'
    return ''
  }, [newPassword])

  const confirmError = useMemo(() => {
    if (!confirmPassword) return ''
    if (newPassword !== confirmPassword) return '비밀번호가 일치하지 않아요'
    return ''
  }, [newPassword, confirmPassword])

  const isSubmitEnabled =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword

  const handleSubmit = async () => {
    if (!isSubmitEnabled || isLoading) return
    setServerError('')
    setIsLoading(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      showToast('비밀번호가 변경되었어요', 'success')
      navigate('/mypage', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '비밀번호 변경에 실패했어요')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 pt-6">
      <ServiceLogo />

      <h2 className="mb-6 text-xl font-bold text-gray-900">비밀번호 변경</h2>

      {/* 현재 비밀번호 */}
      <label className="text-sm font-medium text-gray-700">현재 비밀번호</label>
      <div className="mt-2 flex h-12 items-center rounded-xl border border-gray-200 px-3">
        <input
          type={showPasswords ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="현재 비밀번호를 입력하세요"
          className="flex-1 text-sm outline-none"
        />
        {/* 비밀번호 토글은 모든 입력창에 공통 적용 */}
        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className="w-10 text-gray-400"
        >
          {showPasswords ? '🙈' : '👁'}
        </button>
      </div>

      {/* 새 비밀번호 */}
      <label className="mt-4 text-sm font-medium text-gray-700">새 비밀번호</label>
      <div className="mt-2 flex h-12 items-center rounded-xl border border-gray-200 px-3">
        <input
          type={showPasswords ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="8자 이상 입력하세요"
          className="flex-1 text-sm outline-none"
        />
      </div>
      {newPasswordError && <p className="mt-1 text-xs text-red-500">{newPasswordError}</p>}

      {/* 새 비밀번호 확인 */}
      <label className="mt-4 text-sm font-medium text-gray-700">새 비밀번호 확인</label>
      <input
        type={showPasswords ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="새 비밀번호를 다시 입력하세요"
        className={`mt-2 h-12 w-full rounded-xl border px-4 text-sm outline-none ${
          confirmError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
        }`}
      />
      {confirmError && <p className="mt-1 text-xs text-red-500">{confirmError}</p>}

      {serverError && <p className="mt-3 text-sm text-red-500">{serverError}</p>}

      <button
        onClick={handleSubmit}
        disabled={!isSubmitEnabled || isLoading}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isLoading
          ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          : '비밀번호 변경'}
      </button>

      <button
        onClick={() => navigate('/mypage')}
        className="mt-4 text-center text-sm text-gray-500"
      >
        취소
      </button>
    </div>
  )
}
