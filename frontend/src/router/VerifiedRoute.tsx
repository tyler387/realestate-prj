import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useUserStore } from '../stores/userStore'
import { usePostStore } from '../stores/postStore'
import { VerifyRequiredPage } from '../pages/VerifyRequiredPage'
import { tokenStorage } from '../services/authService'

export const VerifiedRoute = ({ children }: { children: ReactNode }) => {
  const status = useUserStore((s) => s.status)
  const scope = usePostStore((s) => s.scope)
  const hasToken = !!tokenStorage.get()

  if (status === 'GUEST' || !hasToken) {
    return <Navigate to="/login" state={{ redirectTo: '/write' }} replace />
  }

  if (status === 'MEMBER' && scope === 'APARTMENT') {
    return <VerifyRequiredPage />
  }

  return <>{children}</>
}
