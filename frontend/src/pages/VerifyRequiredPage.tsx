import { useNavigate } from 'react-router-dom'
import { AuthBottomSheet } from '../components/common/AuthBottomSheet'

export const VerifyRequiredPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-gray-50">
      <AuthBottomSheet
        isOpen
        userStatus="MEMBER"
        onClose={() => navigate(-1)}
        onLogin={() => navigate('/login', { state: { redirectTo: '/write' } })}
        onSignup={() => navigate('/signup')}
        onVerify={() => navigate('/verify')}
      />
    </div>
  )
}
