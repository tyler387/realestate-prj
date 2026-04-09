import { NavLink, useLocation } from 'react-router-dom'

const HIDDEN_PATHS = ['/post', '/write', '/verify', '/mypage']

const tabs = [
  {
    to: '/',
    label: '커뮤니티',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    to: '/map',
    label: '지도',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
]

export const TabBar = () => {
  const { pathname } = useLocation()
  const isHidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p))
  if (isHidden) return null

  return (
    <nav className="flex h-12 w-full shrink-0 border-b border-gray-200 bg-white">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
              isActive ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'
            }`
          }
        >
          {icon}
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
