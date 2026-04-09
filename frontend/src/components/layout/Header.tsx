import { useNavigate, useLocation } from 'react-router-dom'

const BACK_BUTTON_PATHS = ['/post', '/write', '/verify']

const PAGE_TITLES: Record<string, string> = {
  '/': '커뮤니티',
  '/map': '지도',
  '/write': '글 작성',
  '/verify': '거주지 인증',
  '/mypage': '마이페이지',
}

export const Header = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isBackPattern = BACK_BUTTON_PATHS.some((p) => pathname.startsWith(p))
  const title = pathname.startsWith('/post') ? '게시글' : (PAGE_TITLES[pathname] ?? '')

  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="w-10">
        {isBackPattern ? (
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <span className="text-base font-bold text-blue-500">HB</span>
        )}
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-900">{title}</h1>

      <div className="flex w-10 justify-end">
        {!isBackPattern && (
          <button onClick={() => navigate('/mypage')} className="text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
