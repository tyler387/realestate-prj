import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useUserStore } from '../stores/userStore'

export const MemberRoute = ({ children }: { children: ReactNode }) => {
  const status = useUserStore((s) => s.status)

  if (status === 'GUEST') {
    return <Navigate to="/login" state={{ redirectTo: '/mypage' }} replace />
  }

  return <>{children}</>
}
