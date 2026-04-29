import { useState } from 'react'
import { ApartmentList } from '../components/features/verify/ApartmentList'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'
import { authApi } from '../services/authService'

export const VerifyPage = () => {
  const [query, setQuery] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useUserStore((s) => s.setUser)
  const showToast = useUiStore((s) => s.showToast)

  const handleVerify = async (apartment: { id: number; name: string }) => {
    if (isVerifying) return
    setIsVerifying(true)
    try {
      const res = await authApi.verify(apartment.id, apartment.name)
      setUser({
        userId:                res.userId,
        nickname:              res.nickname,
        status:                'VERIFIED',
        apartmentId:           res.apartmentId,
        apartmentName:         res.apartmentName,
        verifiedApartmentId:   res.apartmentId,
        verifiedApartmentName: res.apartmentName,
      })
      showToast(`${apartment.name} 인증 완료! ✓`, 'success')
      const fromSignup = (location.state as { from?: string } | null)?.from === '/signup'
      if (fromSignup) {
        navigate('/signup/done', { replace: true })
        return
      }
      navigate(-1)
    } catch {
      showToast('인증에 실패했어요. 다시 시도해주세요.', 'error')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex flex-col pb-6">
      <div className="sticky top-0 z-10 bg-white px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="아파트명 또는 주소 검색"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>
      <ApartmentList query={query} onVerify={handleVerify} />
    </div>
  )
}
