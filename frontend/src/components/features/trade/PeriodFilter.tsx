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
              ? 'rounded-full border border-brand-600 bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white shadow-panel'
              : 'rounded-full border border-line-base bg-surface-base px-4 py-1.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-soft'
          }
        >
          {p.label}
        </button>
      ))}
    </div>

    {value === 'custom' && (
      <div className="mt-3 rounded-xl border border-line-base bg-surface-base p-3">
        <p className="mb-2 text-xs font-semibold text-text-body">조회 기간</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate ?? ''}
            onChange={(e) => onCustomDateChange(e.target.value || null, endDate)}
            className="w-full rounded-lg border border-line-base px-2 py-1.5 text-xs text-text-body outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <span className="text-xs text-text-subtle">~</span>
          <input
            type="date"
            value={endDate ?? ''}
            onChange={(e) => onCustomDateChange(startDate, e.target.value || null)}
            className="w-full rounded-lg border border-line-base px-2 py-1.5 text-xs text-text-body outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
    )}
  </div>
)
