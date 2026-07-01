import { useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../stores/uiStore'
import { useUserStore } from '../../stores/userStore'
import { tokenStorage } from '../../services/authService'

const HIDDEN_PATHS = ['/map', '/post', '/write', '/verify', '/login', '/signup', '/trade', '/trade/search', '/trade/apartment']

export const FloatingWriteButton = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const status = useUserStore((s) => s.status)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)

  const isHidden = HIDDEN_PATHS.some((path) => pathname.startsWith(path)) || pathname === '/signup/done'
  if (isHidden) return null

  const handleClick = () => {
    if (status === 'VERIFIED' && tokenStorage.get()) {
      navigate('/write')
      return
    }
    openAuthSheet('write')
  }

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 shadow-floating transition-colors hover:bg-brand-700"
      aria-label="글쓰기"
    >
      <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
