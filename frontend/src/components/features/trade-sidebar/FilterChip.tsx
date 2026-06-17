type Props = {
  label: string
  isSelected: boolean
  onClick: () => void
  disabled?: boolean
  badge?: string
}

export const FilterChip = ({ label, isSelected, onClick, disabled = false, badge }: Props) => (
  <button
    type="button"
    disabled={disabled}
    aria-disabled={disabled}
    title={disabled ? '현재는 매매 실거래만 제공됩니다.' : undefined}
    onClick={() => {
      if (!disabled) onClick()
    }}
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors ${
      disabled
        ? 'cursor-not-allowed bg-gray-50 text-gray-300'
        : isSelected
          ? 'bg-blue-500 text-white'
          : 'cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    <span>{label}</span>
    {badge && (
      <span className={`rounded px-1 py-0.5 text-[10px] leading-none ${
        disabled ? 'bg-gray-100 text-gray-400' : 'bg-white/20 text-current'
      }`}>
        {badge}
      </span>
    )}
  </button>
)
