import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { CommunityPage } from '../pages/CommunityPage'
import { MapPage } from '../pages/MapPage'
import { PostDetailPage } from '../pages/PostDetailPage'
import { WritePage } from '../pages/WritePage'
import { VerifyPage } from '../pages/VerifyPage'
import { MyPage } from '../pages/MyPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <CommunityPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/post/:id', element: <PostDetailPage /> },
      { path: '/write', element: <WritePage /> },
      { path: '/verify', element: <VerifyPage /> },
      { path: '/mypage', element: <MyPage /> },
    ],
  },
])
