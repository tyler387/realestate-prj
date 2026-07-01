type Props = {
  keyword: string
  isSelected: boolean
  onClick: () => void
  rank?: number
  emphasis?: 'top' | 'normal'
}

export const KeywordChip = ({ keyword, isSelected, onClick, rank, emphasis = 'normal' }: Props) => {
  const base = 'rounded-full border px-3 py-1 text-xs font-semibold transition-colors'

  const normalStyle = isSelected
    ? 'border-brand-600 bg-brand-600 text-white'
    : 'cursor-pointer border-line-base bg-surface-soft text-text-body hover:bg-white'

  const topStyle = isSelected
    ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
    : 'cursor-pointer border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100'

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
