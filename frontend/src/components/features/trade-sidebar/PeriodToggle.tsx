type Props = {
  value: '1w' | '1m'
  onChange: (v: '1w' | '1m') => void
}

export const PeriodToggle = ({ value, onChange }: Props) => (
  <div className="flex shrink-0 gap-1">
    {(['1w', '1m'] as const).map((p) => (
      <button
        key={p}
        type="button"
        onClick={() => onChange(p)}
        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] transition-colors ${
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
