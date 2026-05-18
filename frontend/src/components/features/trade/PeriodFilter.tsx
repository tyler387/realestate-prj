type Period = '1m' | '2m' | '3m'

const PERIOD_LABELS: Record<Period, string> = {
  '1m': '1개월',
  '2m': '2개월',
  '3m': '3개월',
}

type Props = {
  value: Period
  onChange: (p: Period) => void
}

export const PeriodFilter = ({ value, onChange }: Props) => (
  <div className="flex gap-2 px-4 py-2">
    {(['1m', '2m', '3m'] as Period[]).map((p) => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={
          p === value
            ? 'rounded-full bg-blue-500 px-4 py-1.5 text-sm font-medium text-white'
            : 'rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-500'
        }
      >
        {PERIOD_LABELS[p]}
      </button>
    ))}
  </div>
)
