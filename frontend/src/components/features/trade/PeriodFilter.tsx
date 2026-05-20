import type { TradePeriod } from '../../../stores/uiStore'

const PERIOD_OPTIONS: Array<{ value: TradePeriod; label: string }> = [
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '6m', label: '6개월' },
  { value: '12m', label: '12개월' },
  { value: 'custom', label: '직접 지정' },
]

type Props = {
  value: TradePeriod
  startDate: string | null
  endDate: string | null
  onChange: (p: TradePeriod) => void
  onCustomDateChange: (startDate: string | null, endDate: string | null) => void
}

export const PeriodFilter = ({
  value,
  startDate,
  endDate,
  onChange,
  onCustomDateChange,
}: Props) => (
  <div className="px-4 py-2">
    <div className="flex flex-wrap gap-2">
      {PERIOD_OPTIONS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={
            p.value === value
              ? 'rounded-full bg-blue-500 px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-500'
          }
        >
          {p.label}
        </button>
      ))}
    </div>

    {value === 'custom' && (
      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
        <p className="mb-2 text-xs font-medium text-gray-600">조회 기간</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate ?? ''}
            onChange={(e) => onCustomDateChange(e.target.value || null, endDate)}
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="date"
            value={endDate ?? ''}
            onChange={(e) => onCustomDateChange(startDate, e.target.value || null)}
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
          />
        </div>
      </div>
    )}
  </div>
)
