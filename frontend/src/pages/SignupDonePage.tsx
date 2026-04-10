import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

export const SignupDonePage = () => {
  const navigate = useNavigate()
  const status = useUserStore((s) => s.status)
  const nickname = useUserStore((s) => s.nickname)
  const setUser = useUserStore((s) => s.setUser)

  useEffect(() => {
    if (status === 'GUEST') {
      setUser({
        userId: 1,
        nickname: nickname ?? '익명_7823',
        status: 'MEMBER',
      })
    }
  }, [status, nickname, setUser])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pb-10 pt-16">
      <div className="text-center text-6xl">🎉</div>
      <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">{nickname ?? '회원'}님, 가입을 환영해요!</h2>
      <p className="mt-2 text-center text-sm text-gray-500">동네 이웃들과 함께 우리 아파트 이야기를 나눠보세요</p>

      <button
        onClick={() => navigate('/')}
        className="mt-12 h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white"
      >
        커뮤니티 둘러보기
      </button>
      <button
        onClick={() => navigate('/verify')}
        className="mt-3 h-12 w-full rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
      >
        거주지 인증하기
      </button>
    </div>
  )
}
