export type TradeType = 'all' | '매매' | '전세' | '월세'

const TYPES: { value: TradeType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '매매', label: '매매' },
  { value: '전세', label: '전세' },
  { value: '월세', label: '월세' },
]

type Props = {
  value: TradeType
  onChange: (t: TradeType) => void
}

export const TradeTypeFilter = ({ value, onChange }: Props) => (
  <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-white">
    {TYPES.map(({ value: v, label }) => (
      <button
        key={v}
        className={`flex h-12 flex-1 items-center justify-center text-sm transition-colors ${
          v === value
            ? 'border-b-2 border-blue-500 font-semibold text-blue-500'
            : 'font-normal text-gray-400'
        }`}
        onClick={() => onChange(v)}
      >
        {label}
      </button>
    ))}
  </div>
)
