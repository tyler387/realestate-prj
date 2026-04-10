import { useNavigate } from 'react-router-dom'

export const TradeSearchBar = () => {
  const navigate = useNavigate()

  return (
    <div
      className="mx-4 my-3 flex cursor-pointer items-center gap-2 rounded-xl bg-gray-100 px-4 py-3"
      onClick={() => navigate('/trade/search')}
    >
      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="text-sm text-gray-400">아파트명으로 검색</span>
    </div>
  )
}
