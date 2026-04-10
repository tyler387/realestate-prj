type Props = {
  value: '1w' | '1m'
  onChange: (v: '1w' | '1m') => void
}

export const PeriodToggle = ({ value, onChange }: Props) => (
  <div className="flex gap-1">
    {(['1w', '1m'] as const).map((p) => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={`rounded-full px-3 py-1 text-xs transition-colors ${
          value === p
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {p === '1w' ? '1주일' : '1개월'}
      </button>
    ))}
  </div>
)
