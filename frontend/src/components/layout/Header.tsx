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
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="w-10">
        {isBackPattern ? (
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-700" aria-label="뒤로가기">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <button onClick={() => navigate('/')} className="text-base font-bold text-blue-500" aria-label="홈으로">HB</button>
        )}
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-900">{title}</h1>

      <div className="flex w-10 justify-end">
        {!isBackPattern && !isAuthPage && (
          <button onClick={onProfileClick} className="text-gray-700" aria-label="마이페이지">
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
