import { useMemo, useState } from 'react'
import { type PriceHistory, type TradeAreaOption, type TradeRecord } from '../../../types/trade'
import { type TradeType } from './TradeTypeFilter'
import { formatPrice } from '../../../utils/formatPrice'
import { type PriceHistoryRange } from '../../../hooks/useApartmentTrade'

type Props = {
  data: PriceHistory[]
  records: TradeRecord[]
  tradeType: TradeType
  areaOptions: TradeAreaOption[]
  selectedArea: number | null
  onAreaChange: (area: number) => void
  priceHistoryRange: PriceHistoryRange
  onPriceHistoryRangeChange: (range: PriceHistoryRange) => void
}

type ChartMode = 'average' | 'trades' | 'pyeong'

type ChartPoint = {
  id: string
  x: number
  y: number
  label: string
  value: number
  subLabel?: string
}

type Tooltip = ChartPoint

const MODE_OPTIONS: Array<{ value: ChartMode; label: string }> = [
  { value: 'average', label: '평균가' },
  { value: 'trades', label: '실거래가' },
  { value: 'pyeong', label: '평당가' },
]

const RANGE_OPTIONS: Array<{ value: PriceHistoryRange; label: string }> = [
  { value: '1y', label: '최근 1년' },
  { value: 'all', label: '전체' },
]

const CHART_WIDTH = 340
const CHART_HEIGHT = 184
const PADDING = { top: 18, bottom: 34, left: 44, right: 16 }
const GRID_LINES = 4

const toMonthKey = (raw: string) => {
  const value = raw.trim()
  if (/^\d{2}\.\d{2}$/.test(value)) return value
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(value)) return value.slice(2, 7)
  return value.slice(0, 5)
}

const isSameArea = (left: number, right: number | null) => right != null && Math.abs(left - right) < 0.0001

const formatArea = (area: number) => {
  const fixed = area.toFixed(2)
  return fixed.replace(/\.?0+$/, '')
}

const formatPyeong = (area: number) => `${Math.round((area * 0.3025) / 0.75)}평형`

const average = (values: number[]) => {
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

const lineFrom = (points: ChartPoint[]) => points.map((point) => `${point.x},${point.y}`).join(' ')

export const PriceChart = ({
  data,
  records,
  tradeType,
  areaOptions,
  selectedArea,
  onAreaChange,
  priceHistoryRange,
  onPriceHistoryRangeChange,
}: Props) => {
  const [mode, setMode] = useState<ChartMode>('average')
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const targetType = tradeType === 'all' ? '매매' : tradeType

  const monthlyHistory = useMemo(
    () => data.filter((item) => item.tradeType === targetType && item.avgPrice > 0).slice(-12),
    [data, targetType],
  )

  const monthKeys = useMemo(() => monthlyHistory.map((item) => item.month), [monthlyHistory])

  const filteredRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.tradeType === targetType &&
          record.price > 0 &&
          isSameArea(record.area, selectedArea) &&
          monthKeys.includes(toMonthKey(record.contractDate)),
      ),
    [monthKeys, records, selectedArea, targetType],
  )

  const monthlyStats = useMemo(() => {
    const grouped = new Map<string, TradeRecord[]>()

    filteredRecords.forEach((record) => {
      const month = toMonthKey(record.contractDate)
      grouped.set(month, [...(grouped.get(month) ?? []), record])
    })

    return monthlyHistory.map((history) => {
      const trades = grouped.get(history.month) ?? []
      const pyeongPrices = trades
        .map((trade) => trade.pricePerPyeong)
        .filter((value): value is number => value != null && value > 0)

      return {
        ...history,
        avgPricePerPyeong: history.avgPricePerPyeong ?? average(pyeongPrices),
        transactionCount: history.transactionCount || trades.length,
      }
    })
  }, [filteredRecords, monthlyHistory])

  const values = useMemo(() => {
    if (mode === 'average') return monthlyStats.map((point) => point.avgPrice)
    if (mode === 'pyeong') {
      return monthlyStats
        .map((point) => point.avgPricePerPyeong)
        .filter((value): value is number => value != null && value > 0)
    }
    return filteredRecords.map((record) => record.price)
  }, [filteredRecords, mode, monthlyStats])

  const hasData = monthKeys.length > 0 && values.length > 0

  if (!hasData) {
    return (
      <div className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
        <ChartHeader
          areaOptions={areaOptions}
          mode={mode}
          selectedArea={selectedArea}
          onAreaChange={onAreaChange}
          onModeChange={setMode}
          targetType={targetType}
          priceHistoryRange={priceHistoryRange}
          onPriceHistoryRangeChange={onPriceHistoryRangeChange}
        />
        <div className="flex h-40 items-center justify-center">
          <span className="text-sm text-gray-400">선택한 조건의 차트 데이터가 없습니다</span>
        </div>
      </div>
    )
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valuePadding = Math.max((maxValue - minValue) * 0.12, maxValue * 0.02, 1)
  const yMin = Math.max(0, Math.floor(minValue - valuePadding))
  const yMax = Math.ceil(maxValue + valuePadding)
  const valueRange = yMax - yMin || 1

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const baselineY = PADDING.top + innerHeight

  const toX = (index: number) => PADDING.left + (index / Math.max(monthKeys.length - 1, 1)) * innerWidth
  const toY = (value: number) => PADDING.top + (1 - (value - yMin) / valueRange) * innerHeight

  const monthlyPoints: ChartPoint[] = monthlyStats
    .map((point, index): ChartPoint | null => {
      const value = mode === 'pyeong' ? point.avgPricePerPyeong : point.avgPrice
      if (value == null || value <= 0) return null

      return {
        id: point.month,
        x: toX(index),
        y: toY(value),
        label: mode === 'pyeong' ? `${point.month} 평균 평당가` : `${point.month} 월평균`,
        value,
        subLabel: `${point.transactionCount}건`,
      }
    })
    .filter((point): point is ChartPoint => point != null)

  const tradeGroups = new Map<string, TradeRecord[]>()
  filteredRecords.forEach((record) => {
    const month = toMonthKey(record.contractDate)
    tradeGroups.set(month, [...(tradeGroups.get(month) ?? []), record])
  })

  const tradePoints: ChartPoint[] = monthKeys.flatMap((month, monthIndex) => {
    const trades = tradeGroups.get(month) ?? []
    const xStep = Math.min(18, innerWidth / Math.max(monthKeys.length, 1) * 0.35)

    return trades.map((trade, tradeIndex) => {
      const offset =
        trades.length <= 1 ? 0 : ((tradeIndex / Math.max(trades.length - 1, 1)) - 0.5) * xStep
      return {
        id: `${trade.id}-${trade.contractDate}`,
        x: toX(monthIndex) + offset,
        y: toY(trade.price),
        label: `${trade.contractDate} 실거래`,
        value: trade.price,
        subLabel: `${trade.area.toFixed(1)}㎡ · ${trade.floor}층`,
      }
    })
  })

  const points = mode === 'trades' ? tradePoints : monthlyPoints
  const linePoints = mode === 'trades' ? '' : lineFrom(points)
  const fillPoints =
    mode === 'trades' || points.length < 2
      ? ''
      : [`${points[0].x},${baselineY}`, ...points.map((point) => `${point.x},${point.y}`), `${points[points.length - 1].x},${baselineY}`].join(' ')

  const yLabels = Array.from({ length: GRID_LINES + 1 }, (_, index) => {
    const ratio = index / GRID_LINES
    return {
      y: PADDING.top + ratio * innerHeight,
      value: Math.round(yMax - ratio * valueRange),
    }
  })

  const strokeColor = mode === 'pyeong' ? '#059669' : '#2563eb'
  const pointColor = mode === 'trades' ? '#334155' : strokeColor

  return (
    <div className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
      <ChartHeader
        areaOptions={areaOptions}
        mode={mode}
        selectedArea={selectedArea}
        onAreaChange={onAreaChange}
        onModeChange={setMode}
        targetType={targetType}
        priceHistoryRange={priceHistoryRange}
        onPriceHistoryRangeChange={onPriceHistoryRangeChange}
      />

      <div className="relative h-56">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-full w-full"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="price-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.14" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yLabels.map((label) => (
            <g key={label.y}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={label.y}
                y2={label.y}
                stroke="#eef2f7"
                strokeWidth="1"
              />
              <text x={PADDING.left - 8} y={label.y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">
                {formatPrice(label.value)}
              </text>
            </g>
          ))}

          {fillPoints && <polygon points={fillPoints} fill="url(#price-chart-fill)" />}

          {linePoints && points.length >= 2 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point) => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={mode === 'trades' ? 3.2 : 4}
              fill={mode === 'trades' ? pointColor : 'white'}
              fillOpacity={mode === 'trades' ? 0.72 : 1}
              stroke={pointColor}
              strokeWidth={mode === 'trades' ? 1 : 2}
              className="cursor-pointer"
              onMouseEnter={() => setTooltip(point)}
            />
          ))}

          {monthKeys.map((month, index) => (
            <text key={month} x={toX(index)} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize="8" fill="#9ca3af">
              {month}
            </text>
          ))}
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-gray-900 px-2 py-1 text-xs text-white shadow"
            style={{ left: `${(tooltip.x / CHART_WIDTH) * 100}%`, top: `${(tooltip.y / CHART_HEIGHT) * 100}%` }}
          >
            <p className="whitespace-nowrap">{tooltip.label}</p>
            <p className="whitespace-nowrap font-semibold">{formatPrice(tooltip.value)}</p>
            {tooltip.subLabel && <p className="whitespace-nowrap text-[11px] text-gray-200">{tooltip.subLabel}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

type ChartHeaderProps = {
  areaOptions: TradeAreaOption[]
  mode: ChartMode
  selectedArea: number | null
  onAreaChange: (area: number) => void
  onModeChange: (mode: ChartMode) => void
  targetType: Exclude<TradeType, 'all'>
  priceHistoryRange: PriceHistoryRange
  onPriceHistoryRangeChange: (range: PriceHistoryRange) => void
}

const ChartHeader = ({
  areaOptions,
  mode,
  selectedArea,
  onAreaChange,
  onModeChange,
  targetType,
  priceHistoryRange,
  onPriceHistoryRangeChange,
}: ChartHeaderProps) => (
  <div className="mb-3">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold text-gray-700">가격 흐름 ({targetType})</p>
      <div className="flex min-w-0 flex-wrap justify-end gap-2">
        <div className="flex shrink-0 rounded-lg bg-gray-100 p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPriceHistoryRangeChange(option.value)}
              className={`h-7 rounded-md px-2 text-[11px] font-semibold transition-colors ${
                priceHistoryRange === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 rounded-lg bg-gray-100 p-1">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={`h-7 rounded-md px-2 text-[11px] font-semibold transition-colors ${
                mode === option.value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
      {areaOptions.map((option) => (
        <button
          key={option.area}
          type="button"
          title={`전용 ${formatArea(option.area)}㎡ · ${option.transactionCount}건`}
          onClick={() => onAreaChange(option.area)}
          className={`flex h-10 shrink-0 flex-col items-center justify-center rounded-md px-3 text-xs font-medium leading-tight transition-colors ${
            isSameArea(option.area, selectedArea) ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>{formatPyeong(option.area)}</span>
          <span className="text-[10px] font-normal text-gray-400">전용 {formatArea(option.area)}㎡</span>
        </button>
      ))}
    </div>
  </div>
)
