type FilterChipProps = {
  label:      string
  isSelected: boolean
  onClick:    () => void
}

export const FilterChip = ({ label, isSelected, onClick }: FilterChipProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
      ${isSelected
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
  >
    {label}
  </button>
)
