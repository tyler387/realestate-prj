import { useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../../stores/userStore'

const HIDDEN_PATHS = ['/map', '/post', '/write', '/verify']

export const FloatingWriteButton = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useUserStore((s) => s.user)

  const isHidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p))
  if (isHidden) return null

  const handleClick = () => {
    if (user?.verified) navigate('/write')
    else navigate('/verify')
  }

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg transition-colors hover:bg-blue-600"
    >
      <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
