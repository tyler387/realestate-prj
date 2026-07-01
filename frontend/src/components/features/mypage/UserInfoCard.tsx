import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../../stores/userStore'

export const UserInfoCard = () => {
  const navigate = useNavigate()
  const nickname = useUserStore((s) => s.nickname)
  const status = useUserStore((s) => s.status)
  const verifiedApartmentName = useUserStore((s) => s.verifiedApartmentName)

  return (
    <div className="mx-4 mt-3 rounded-xl border border-line-base bg-surface-base p-4">
      <p className="text-lg font-black text-text-strong">{nickname ?? '이웃'}</p>

      {status === 'VERIFIED' ? (
        <p className="mt-1 text-sm font-semibold text-market-rent">{verifiedApartmentName ?? '아파트'} · 인증완료</p>
      ) : (
        <div>
          <span className="mt-2 inline-flex rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
            거주지 미인증
          </span>
          <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-sm font-medium text-brand-700">거주지를 인증하면 글쓰기, 댓글이 가능해요</p>
            <button
              onClick={() => navigate('/verify')}
              className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              지금 인증하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
