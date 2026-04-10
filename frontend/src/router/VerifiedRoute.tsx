import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useUserStore } from '../stores/userStore'
import { VerifyRequiredPage } from '../pages/VerifyRequiredPage'

export const VerifiedRoute = ({ children }: { children: ReactNode }) => {
  const status = useUserStore((s) => s.status)

  if (status === 'GUEST') {
    return <Navigate to="/login" state={{ redirectTo: '/write' }} replace />
  }

  if (status === 'MEMBER') {
    return <VerifyRequiredPage />
  }

  return <>{children}</>
}
