type Props = {
  keyword: string
  isSelected: boolean
  onClick: () => void
}

export const KeywordChip = ({ keyword, isSelected, onClick }: Props) => (
  <button
    onClick={onClick}
    className={`rounded-full px-3 py-1 text-xs transition-colors ${
      isSelected
        ? 'bg-blue-500 text-white'
        : 'cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {keyword}
  </button>
)
