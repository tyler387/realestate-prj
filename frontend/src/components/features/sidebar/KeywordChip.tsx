type Props = {
  keyword: string
  isSelected: boolean
  onClick: () => void
  rank?: number
  emphasis?: 'top' | 'normal'
}

export const KeywordChip = ({ keyword, isSelected, onClick, rank, emphasis = 'normal' }: Props) => {
  const base = 'rounded-full px-3 py-1 text-xs transition-colors'

  const normalStyle = isSelected
    ? 'bg-blue-500 text-white'
    : 'cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200'

  const topStyle = isSelected
    ? 'bg-blue-600 text-white shadow-sm'
    : 'cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100'

  return (
    <button
      type="button"
      onClick={onClick}
      title={keyword}
      className={`${base} ${emphasis === 'top' ? topStyle : normalStyle}`}
    >
      {rank != null && <span className="mr-1 text-[10px] font-semibold">{rank}</span>}
      <span className="inline-block max-w-[108px] truncate align-bottom">{keyword}</span>
    </button>
  )
}
