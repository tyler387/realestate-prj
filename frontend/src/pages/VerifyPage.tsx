import { useState } from 'react'
import { ApartmentList } from '../components/features/verify/ApartmentList'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

export const VerifyPage = () => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useUserStore((s) => s.setUser)
  const nickname = useUserStore((s) => s.nickname)
  const userId = useUserStore((s) => s.userId)
  const showToast = useUiStore((s) => s.showToast)

  const handleVerify = (apartment: { id: number; name: string }) => {
    setUser({
      userId: userId ?? 1,
      nickname: nickname ?? '익명_7823',
      status: 'VERIFIED',
      apartmentId:           apartment.id,
      apartmentName:         apartment.name,
      verifiedApartmentId:   apartment.id,
      verifiedApartmentName: apartment.name,
    })

    showToast(`${apartment.name} 인증 완료! ✓`, 'success')

    const fromSignup = (location.state as { from?: string } | null)?.from === '/signup'
    if (fromSignup) {
      navigate('/signup/done', { replace: true })
      return
    }

    navigate(-1)
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
