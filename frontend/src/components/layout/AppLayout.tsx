import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { FloatingWriteButton } from './FloatingWriteButton'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { TradeLeftSidebar } from './TradeLeftSidebar'
import { TradeRightSidebar } from './TradeRightSidebar'
import { AuthBottomSheet } from '../common/AuthBottomSheet'
import { Toast } from '../common/Toast'
import { useUiStore } from '../../stores/uiStore'
import { useUserStore } from '../../stores/userStore'
import { usePostStore } from '../../stores/postStore'

export const AppLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const status = useUserStore((s) => s.status)
  const { apartmentId } = useUserStore()
  const { scope, boardCode } = usePostStore()
  const isAuthSheetOpen = useUiStore((s) => s.isAuthSheetOpen)
  const authSheetAction = useUiStore((s) => s.authSheetAction)
  const closeAuthSheet = useUiStore((s) => s.closeAuthSheet)

  const canOpenAuthSheet = status === 'GUEST' || status === 'MEMBER'
  // 아파트 미선택 시 빈 문자열 → 사이드바 훅 enabled:false 처리
  const aptId = apartmentId != null ? String(apartmentId) : ''

  // 커뮤니티 사이드바
  const showCommLeft  = pathname === '/'
  const showCommRight = pathname === '/' || pathname.startsWith('/post/')

  // 실거래 사이드바
  const showTradeLeft  = pathname === '/trade'
  const showTradeRight = pathname === '/trade'

  const showLeft  = showCommLeft  || showTradeLeft
  const showRight = showCommRight || showTradeRight

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <Header />
      <TabBar />

      <div className="flex flex-1 justify-center overflow-hidden">
        {showLeft && (
          <aside className="modern-scroll hidden w-[280px] shrink-0 overflow-y-auto pb-4 pl-2 pr-4 pt-4 lg:block">
            {showCommLeft  && <LeftSidebar scope={scope} aptId={aptId} boardCode={boardCode} />}
            {showTradeLeft && <TradeLeftSidebar />}
          </aside>
        )}

        <div className="relative flex min-w-0 max-w-3xl flex-1 flex-col overflow-hidden bg-gray-50 shadow-xl">
          <main className="modern-scroll flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <FloatingWriteButton />

          {canOpenAuthSheet && (
            <AuthBottomSheet
              isOpen={isAuthSheetOpen}
              userStatus={status}
              action={authSheetAction}
              onClose={closeAuthSheet}
              onLogin={() => {
                closeAuthSheet()
                navigate('/login', { state: { redirectTo: pathname } })
              }}
              onSignup={() => {
                closeAuthSheet()
                navigate('/signup')
              }}
              onVerify={() => {
                closeAuthSheet()
                navigate('/verify')
              }}
            />
          )}

          <Toast />
        </div>

        {showRight && (
          <aside className="modern-scroll hidden w-[280px] shrink-0 overflow-y-auto pb-4 pl-4 pr-2 pt-4 lg:block">
            {showCommRight  && <RightSidebar scope={scope} aptId={aptId} boardCode={boardCode} />}
            {showTradeRight && <TradeRightSidebar />}
          </aside>
        )}
      </div>
    </div>
  )
}
