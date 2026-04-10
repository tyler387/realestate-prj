type Props = {
  items: string[]
  onSelect: (term: string) => void
  onRemove: (term: string) => void
  onClearAll: () => void
}

export const RecentSearchList = ({ items, onSelect, onRemove, onClearAll }: Props) => {
  if (items.length === 0) return null

  return (
    <div className="px-4 py-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700">최근 검색</span>
        <button className="text-xs text-gray-400" onClick={onClearAll}>전체삭제</button>
      </div>
      {items.map((term) => (
        <div key={term} className="flex items-center py-2">
          <span
            className="flex-1 cursor-pointer text-sm text-gray-700"
            onClick={() => onSelect(term)}
          >
            {term}
          </span>
          <button className="ml-2 text-gray-400" onClick={() => onRemove(term)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
