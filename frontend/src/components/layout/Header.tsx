import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '../../stores/userStore'

const BACK_BUTTON_PATHS = ['/post', '/write', '/verify', '/trade/search', '/trade/apartment', '/login', '/signup']
const AUTH_PAGE_PATHS = ['/login', '/signup', '/signup/done']

const PAGE_TITLES: Record<string, string> = {
  '/': '커뮤니티',
  '/trade': '실거래',
  '/map': '지도',
  '/write': '글 작성',
  '/verify': '거주지 인증',
  '/mypage': '마이페이지',
  '/trade/search': '아파트 검색',
  '/login': '로그인',
  '/signup': '회원가입',
  '/signup/done': '가입 완료',
}

export const Header = () => {
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const status        = useUserStore((s) => s.status)
  const apartmentName = useUserStore((s) => s.apartmentName)

  const isBackPattern = BACK_BUTTON_PATHS.some((path) => pathname.startsWith(path)) && pathname !== '/signup/done'
  const isAuthPage    = AUTH_PAGE_PATHS.some((path) => pathname.startsWith(path))

  let title = PAGE_TITLES[pathname] ?? ''
  if (pathname === '/') {
    title = apartmentName ? `${apartmentName} 커뮤니티` : '커뮤니티'
  }
  if (pathname.startsWith('/post')) title = '게시글'
  if (pathname.startsWith('/trade/apartment/')) {
    title = (state as { apartmentName?: string } | null)?.apartmentName ?? '아파트 상세'
  }

  const onProfileClick = () => {
    if (status === 'GUEST') {
      navigate('/login', { state: { redirectTo: '/' } })
      return
    }
    navigate('/mypage')
  }

  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-line-base bg-surface-base px-4">
      <div className="w-24">
        {isBackPattern ? (
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-text-body transition-colors hover:bg-surface-soft" aria-label="뒤로가기">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <button onClick={() => navigate('/')} className="flex items-center gap-2" aria-label="홈으로">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black tracking-tight text-white">
              HB
            </span>
            <span className="hidden text-base font-extrabold tracking-tight text-brand-700 sm:inline">
              HomeBlind
            </span>
          </button>
        )}
      </div>

      <h1 className="absolute left-1/2 max-w-[52%] -translate-x-1/2 truncate text-lg font-bold text-text-strong">{title}</h1>

      <div className="flex w-24 justify-end">
        {!isBackPattern && !isAuthPage && (
          <button onClick={onProfileClick} className="flex h-10 w-10 items-center justify-center rounded-full text-text-body transition-colors hover:bg-surface-soft" aria-label="마이페이지">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
