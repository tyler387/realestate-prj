import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../../stores/userStore'

export const UserInfoCard = () => {
  const navigate = useNavigate()
  const nickname = useUserStore((s) => s.nickname)
  const status = useUserStore((s) => s.status)
  const apartmentName = useUserStore((s) => s.apartmentName)

  return (
    <div className="bg-white px-4 py-5">
      <p className="text-lg font-bold text-gray-900">{nickname ?? '이웃'}</p>

      {status === 'VERIFIED' ? (
        <p className="mt-1 text-sm text-green-500">{apartmentName ?? '아파트'} · 인증완료 ✓</p>
      ) : (
        <div>
          <span className="mt-1 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-500">
            거주지 미인증
          </span>
          <div className="mt-3 rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-blue-700">🏠 거주지를 인증하면 글쓰기, 댓글이 가능해요</p>
            <button
              onClick={() => navigate('/verify')}
              className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white"
            >
              지금 인증하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
