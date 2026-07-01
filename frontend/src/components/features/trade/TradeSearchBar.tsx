import { useNavigate } from 'react-router-dom'

export const TradeSearchBar = () => {
  const navigate = useNavigate()

  return (
    <div
      className="mx-4 my-3 flex cursor-pointer items-center gap-3 rounded-xl border border-line-base bg-surface-base px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-colors hover:border-brand-100 hover:bg-white"
      onClick={() => navigate('/trade/search')}
    >
      <svg className="h-4 w-4 text-text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="text-sm font-medium text-text-muted">아파트명으로 검색</span>
    </div>
  )
}
