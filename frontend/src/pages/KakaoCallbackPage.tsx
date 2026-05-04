import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, tokenStorage } from '../services/authService'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

export const KakaoCallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setUser = useUserStore((s) => s.setUser)
  const showToast = useUiStore((s) => s.showToast)
  const [error, setError] = useState('')

  useEffect(() => {
    // 카카오 인증이 끝나면 code가 쿼리스트링으로 돌아온다.
    // 이 code를 백엔드에 전달하면, 백엔드가 카카오와 통신해 최종 로그인 처리한다.
    const code = searchParams.get('code')
    if (!code) {
      setError('카카오 인증 코드가 없어요. 다시 시도해주세요.')
      return
    }

    const redirectUri = `${window.location.origin}/auth/kakao/callback`
    authApi.kakaoLogin(code, redirectUri)
      .then((res) => {
        // 백엔드가 발급한 JWT/사용자정보를 저장하면 앱이 로그인 상태로 전환된다.
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
        showToast('카카오로 로그인되었어요 👋', 'success')
        navigate('/', { replace: true })
      })
      .catch((e) => {
        const message = e instanceof Error ? e.message : '카카오 로그인에 실패했어요.'
        setError(message)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-sm text-red-500">{error}</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="h-12 w-full max-w-xs rounded-xl bg-blue-500 text-sm font-semibold text-white"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
        <p className="text-sm text-gray-500">카카오 로그인 중...</p>
      </div>
    </div>
  )
}
