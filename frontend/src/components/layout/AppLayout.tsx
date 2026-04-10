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

export const AppLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const status = useUserStore((s) => s.status)
  const { apartmentId } = useUserStore()
  const isAuthSheetOpen = useUiStore((s) => s.isAuthSheetOpen)
  const closeAuthSheet = useUiStore((s) => s.closeAuthSheet)

  const canOpenAuthSheet = status === 'GUEST' || status === 'MEMBER'
  const aptId = String(apartmentId ?? 'apt-001')

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
          <aside className="hidden w-[260px] shrink-0 overflow-y-auto pb-4 pl-2 pr-4 pt-4 lg:block">
            {showCommLeft  && <LeftSidebar aptId={aptId} />}
            {showTradeLeft && <TradeLeftSidebar />}
          </aside>
        )}

        <div className="relative flex min-w-0 max-w-3xl flex-1 flex-col overflow-hidden bg-gray-50 shadow-xl">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <FloatingWriteButton />

          {canOpenAuthSheet && (
            <AuthBottomSheet
              isOpen={isAuthSheetOpen}
              userStatus={status}
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
          <aside className="hidden w-[260px] shrink-0 overflow-y-auto pb-4 pl-4 pr-2 pt-4 lg:block">
            {showCommRight  && <RightSidebar aptId={aptId} />}
            {showTradeRight && <TradeRightSidebar />}
          </aside>
        )}
      </div>
    </div>
  )
}
