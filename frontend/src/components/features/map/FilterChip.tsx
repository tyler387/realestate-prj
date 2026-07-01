type FilterChipProps = {
  label:      string
  isSelected: boolean
  onClick:    () => void
}

export const FilterChip = ({ label, isSelected, onClick }: FilterChipProps) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors
      ${isSelected
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-line-base bg-surface-base text-text-body hover:bg-surface-soft'
      }`}
  >
    {label}
  </button>
)
