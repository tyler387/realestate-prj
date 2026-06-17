export type TradeType = 'all' | '매매' | '전세' | '월세'

const TYPES: { value: TradeType; label: string; disabled?: boolean; badge?: string }[] = [
  { value: 'all', label: '전체' },
  { value: '매매', label: '매매' },
  // 현재 수집기는 매매 전용이므로 전월세는 선택 대신 준비 상태만 노출한다.
  { value: '전세', label: '전세', disabled: true, badge: '준비중' },
  { value: '월세', label: '월세', disabled: true, badge: '준비중' },
]

type Props = {
  value: TradeType
  onChange: (t: TradeType) => void
}

export const TradeTypeFilter = ({ value, onChange }: Props) => (
  <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-white">
    {TYPES.map(({ value: v, label, disabled, badge }) => (
      <button
        key={v}
        type="button"
        disabled={disabled}
        aria-disabled={disabled}
        title={disabled ? '현재는 매매 실거래만 제공됩니다.' : undefined}
        className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-1 text-sm transition-colors ${
          disabled
            ? 'cursor-not-allowed text-gray-300'
            : v === value
              ? 'border-b-2 border-blue-500 font-semibold text-blue-500'
              : 'font-normal text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => {
          if (!disabled) onChange(v)
        }}
      >
        <span className="truncate">{label}</span>
        {badge && (
          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] leading-none text-gray-400">
            {badge}
          </span>
        )}
      </button>
    ))}
  </div>
)
