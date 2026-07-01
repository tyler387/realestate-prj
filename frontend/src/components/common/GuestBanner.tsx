import { useNavigate } from 'react-router-dom'

type GuestBannerProps = {
  isVisible: boolean
  onClose: () => void
}

export const GuestBanner = ({ isVisible, onClose }: GuestBannerProps) => {
  const navigate = useNavigate()

  if (!isVisible) return null

  return (
    <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
      <p className="text-sm font-medium text-brand-700">회원가입하고 이웃과 소통해보세요</p>
      <div className="ml-3 flex items-center gap-2">
        <button onClick={() => navigate('/signup')} className="text-xs font-bold text-brand-700">
          가입하기
        </button>
        <button onClick={onClose} className="text-sm font-semibold text-text-subtle" aria-label="배너 닫기">
          ✕
        </button>
      </div>
    </div>
  )
}
