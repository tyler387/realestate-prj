import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { CommunityPage } from '../pages/CommunityPage'
import { MapPage } from '../pages/MapPage'
import { PostDetailPage } from '../pages/PostDetailPage'
import { WritePage } from '../pages/WritePage'
import { VerifyPage } from '../pages/VerifyPage'
import { MyPage } from '../pages/MyPage'
import { TradePage } from '../pages/TradePage'
import { TradeSearchPage } from '../pages/TradeSearchPage'
import { ApartmentTradePage } from '../pages/ApartmentTradePage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { SignupDonePage } from '../pages/SignupDonePage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { KakaoCallbackPage } from '../pages/KakaoCallbackPage'
import { MemberRoute } from './MemberRoute'
import { VerifiedRoute } from './VerifiedRoute'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <CommunityPage /> },
      { path: '/trade', element: <TradePage /> },
      { path: '/trade/search', element: <TradeSearchPage /> },
      { path: '/trade/apartment/:id', element: <ApartmentTradePage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/post/:id', element: <PostDetailPage /> },
      {
        path: '/write',
        element: (
          <VerifiedRoute>
            <WritePage />
          </VerifiedRoute>
        ),
      },
      { path: '/verify', element: <VerifyPage /> },
      {
        path: '/mypage',
        element: (
          <MemberRoute>
            <MyPage />
          </MemberRoute>
        ),
      },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/signup/done', element: <SignupDonePage /> },
      // 비밀번호 찾기/재설정 플로우
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      // 카카오 인증 완료 후 돌아오는 콜백 경로
      { path: '/auth/kakao/callback', element: <KakaoCallbackPage /> },
    ],
  },
])
