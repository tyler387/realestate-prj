type Props = {
  aptName: string
  onClear: () => void
}

export const AptFilterBanner = ({ aptName, onClear }: Props) => (
  <div className="mx-4 mt-2 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
    <span className="text-sm text-blue-700">📍 {aptName} 필터 적용 중</span>
    <button
      onClick={onClear}
      className="ml-2 text-xs font-medium text-blue-500 transition-colors hover:text-blue-700"
    >
      해제
    </button>
  </div>
)
