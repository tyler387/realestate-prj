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
  isTradeRecordLimited?: boolean
  tradeRecordLimit?: number
}

type ChartMode = 'average' | 'trades' | 'pyeong'
type MovingAverageWindow = 'off' | '3m' | '6m'

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

const MOVING_AVERAGE_OPTIONS: Array<{ value: MovingAverageWindow; label: string; windowSize: number | null }> = [
  { value: 'off', label: '이동평균 OFF', windowSize: null },
  { value: '3m', label: '3개월', windowSize: 3 },
  { value: '6m', label: '6개월', windowSize: 6 },
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

const getMovingAverageWindowSize = (value: MovingAverageWindow) =>
  MOVING_AVERAGE_OPTIONS.find((option) => option.value === value)?.windowSize ?? null

export const PriceChart = ({
  data,
  records,
  tradeType,
  areaOptions,
  selectedArea,
  onAreaChange,
  priceHistoryRange,
  onPriceHistoryRangeChange,
  isTradeRecordLimited = false,
  tradeRecordLimit,
}: Props) => {
  const [mode, setMode] = useState<ChartMode>('average')
  const [movingAverageWindow, setMovingAverageWindow] = useState<MovingAverageWindow>('off')
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const targetType = tradeType === 'all' ? '매매' : tradeType
  const effectiveMode = isTradeRecordLimited && mode === 'trades' ? 'average' : mode

  const monthlyHistory = useMemo(
    // 전체 기간 보기에서는 API가 넘긴 모든 월을 그린다. 화면에서 임의로 12개월 제한하지 않는다.
    () => data.filter((item) => item.tradeType === targetType && item.avgPrice > 0),
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

  const monthlyStats = monthlyHistory

  const values = useMemo(() => {
    const baseValues =
      effectiveMode === 'average'
        ? monthlyStats.map((point) => point.avgPrice)
        : effectiveMode === 'pyeong'
          ? monthlyStats
            .map((point) => point.avgPricePerPyeong)
            .filter((value): value is number => value != null && value > 0)
          : filteredRecords.map((record) => record.price)

    const windowSize = getMovingAverageWindowSize(movingAverageWindow)
    // 실거래 점 모드는 점 자체가 많아 이동평균선을 숨겨 시각적 혼잡을 줄인다.
    if (effectiveMode === 'trades' || windowSize == null) return baseValues

    // Y축 스케일이 이동평균선을 잘라내지 않도록 이동평균 값도 스케일 계산에 포함한다.
    const movingAverageValues = monthlyStats
      .map((point) => effectiveMode === 'pyeong' ? point.avgPricePerPyeong : point.avgPrice)
      .map((value, index, source) => {
        if (value == null || value <= 0 || index + 1 < windowSize) return null
        const slice = source.slice(index + 1 - windowSize, index + 1)
        if (slice.some((item) => item == null || item <= 0)) return null
        return average(slice as number[])
      })
      .filter((value): value is number => value != null && value > 0)

    return [...baseValues, ...movingAverageValues]
  }, [effectiveMode, filteredRecords, monthlyStats, movingAverageWindow])

  const movingAverageWindowSize = getMovingAverageWindowSize(movingAverageWindow)
  const showMovingAverage = effectiveMode !== 'trades' && movingAverageWindowSize != null
  const hasEnoughMovingAverageSamples = !showMovingAverage || monthlyStats.length >= movingAverageWindowSize

  const movingAverageByMonth = useMemo(() => {
    if (!showMovingAverage || movingAverageWindowSize == null) return new Map<string, number>()

    const source = monthlyStats.map((point) => ({
      month: point.month,
      value: effectiveMode === 'pyeong' ? point.avgPricePerPyeong : point.avgPrice,
    }))

    const result = new Map<string, number>()
    source.forEach((point, index) => {
      if (point.value == null || point.value <= 0 || index + 1 < movingAverageWindowSize) return
      const slice = source.slice(index + 1 - movingAverageWindowSize, index + 1).map((item) => item.value)
      if (slice.some((value) => value == null || value <= 0)) return
      result.set(point.month, average(slice as number[]) ?? 0)
    })

    return result
  }, [effectiveMode, monthlyStats, movingAverageWindowSize, showMovingAverage])

  const movingAverageLabel = movingAverageWindowSize == null ? '' : `${movingAverageWindowSize}개월 이동평균`

  const hasData = monthKeys.length > 0 && values.length > 0

  if (!hasData) {
    return (
      <div className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
        <ChartHeader
          areaOptions={areaOptions}
          mode={effectiveMode}
          selectedArea={selectedArea}
          onAreaChange={onAreaChange}
          onModeChange={setMode}
          isTradesModeDisabled={isTradeRecordLimited}
          targetType={targetType}
          priceHistoryRange={priceHistoryRange}
          onPriceHistoryRangeChange={onPriceHistoryRangeChange}
          movingAverageWindow={movingAverageWindow}
          onMovingAverageWindowChange={setMovingAverageWindow}
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
      const value = effectiveMode === 'pyeong' ? point.avgPricePerPyeong : point.avgPrice
      if (value == null || value <= 0) return null

      const movingAverageValue = movingAverageByMonth.get(point.month)
      return {
        id: point.month,
        x: toX(index),
        y: toY(value),
        label: effectiveMode === 'pyeong' ? `${point.month} 평균 평당가` : `${point.month} 월평균`,
        value,
        subLabel: [
          `${point.transactionCount}건`,
          movingAverageValue != null ? `${movingAverageLabel} ${formatPrice(movingAverageValue)}` : null,
        ].filter(Boolean).join(' · '),
      }
    })
    .filter((point): point is ChartPoint => point != null)

  const movingAveragePoints: ChartPoint[] =
    showMovingAverage && hasEnoughMovingAverageSamples
      ? monthlyStats
        .map((point, index): ChartPoint | null => {
          const value = movingAverageByMonth.get(point.month)
          if (value == null || value <= 0) return null
          return {
            id: `ma-${point.month}`,
            x: toX(index),
            y: toY(value),
            label: `${point.month} ${movingAverageLabel}`,
            value,
          }
        })
        .filter((point): point is ChartPoint => point != null)
      : []

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

  const points = effectiveMode === 'trades' ? tradePoints : monthlyPoints
  const linePoints = effectiveMode === 'trades' ? '' : lineFrom(points)
  const movingAverageLinePoints = lineFrom(movingAveragePoints)
  const fillPoints =
    effectiveMode === 'trades' || points.length < 2
      ? ''
      : [`${points[0].x},${baselineY}`, ...points.map((point) => `${point.x},${point.y}`), `${points[points.length - 1].x},${baselineY}`].join(' ')

  const yLabels = Array.from({ length: GRID_LINES + 1 }, (_, index) => {
    const ratio = index / GRID_LINES
    return {
      y: PADDING.top + ratio * innerHeight,
      value: Math.round(yMax - ratio * valueRange),
    }
  })

  const strokeColor = effectiveMode === 'pyeong' ? '#059669' : '#2563eb'
  const pointColor = effectiveMode === 'trades' ? '#334155' : strokeColor
  const movingAverageColor = '#f59e0b'

  return (
    <div className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
      <ChartHeader
        areaOptions={areaOptions}
        mode={effectiveMode}
        selectedArea={selectedArea}
        onAreaChange={onAreaChange}
        onModeChange={setMode}
        isTradesModeDisabled={isTradeRecordLimited}
        targetType={targetType}
        priceHistoryRange={priceHistoryRange}
        onPriceHistoryRangeChange={onPriceHistoryRangeChange}
        movingAverageWindow={movingAverageWindow}
        onMovingAverageWindowChange={setMovingAverageWindow}
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

          {movingAverageLinePoints && movingAveragePoints.length >= 2 && (
            <polyline
              points={movingAverageLinePoints}
              fill="none"
              stroke={movingAverageColor}
              strokeWidth="2"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point) => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={effectiveMode === 'trades' ? 3.2 : 4}
              fill={effectiveMode === 'trades' ? pointColor : 'white'}
              fillOpacity={effectiveMode === 'trades' ? 0.72 : 1}
              stroke={pointColor}
              strokeWidth={effectiveMode === 'trades' ? 1 : 2}
              className="cursor-pointer"
              onMouseEnter={() => setTooltip(point)}
            />
          ))}

          {movingAveragePoints.map((point) => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={3}
              fill="white"
              stroke={movingAverageColor}
              strokeWidth="1.5"
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

      {showMovingAverage && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
          <span className="h-0.5 w-5 rounded-full bg-amber-500" />
          <span>
            {hasEnoughMovingAverageSamples
              ? `${movingAverageLabel} 표시 중`
              : `${movingAverageLabel}을 표시하기에는 표본이 부족합니다`}
          </span>
        </div>
      )}
      {isTradeRecordLimited && (
        <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          실거래가 점 모드는 최근 거래 {tradeRecordLimit?.toLocaleString() ?? '일부'}건만 표시할 수 있어 평균 차트로 분리했습니다.
        </div>
      )}
    </div>
  )
}

type ChartHeaderProps = {
  areaOptions: TradeAreaOption[]
  mode: ChartMode
  selectedArea: number | null
  onAreaChange: (area: number) => void
  onModeChange: (mode: ChartMode) => void
  isTradesModeDisabled: boolean
  targetType: Exclude<TradeType, 'all'>
  priceHistoryRange: PriceHistoryRange
  onPriceHistoryRangeChange: (range: PriceHistoryRange) => void
  movingAverageWindow: MovingAverageWindow
  onMovingAverageWindowChange: (window: MovingAverageWindow) => void
}

const ChartHeader = ({
  areaOptions,
  mode,
  selectedArea,
  onAreaChange,
  onModeChange,
  isTradesModeDisabled,
  targetType,
  priceHistoryRange,
  onPriceHistoryRangeChange,
  movingAverageWindow,
  onMovingAverageWindowChange,
}: ChartHeaderProps) => (
  <div className="mb-3">
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-gray-700">가격 흐름 ({targetType})</p>
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
    </div>

    <div className="mb-3 flex flex-wrap justify-end gap-2">
      <div className="flex shrink-0 rounded-lg bg-gray-100 p-1">
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!(isTradesModeDisabled && option.value === 'trades')) onModeChange(option.value)
            }}
            disabled={isTradesModeDisabled && option.value === 'trades'}
            title={isTradesModeDisabled && option.value === 'trades' ? '최근 거래 제한이 적용되어 평균 차트로 표시합니다.' : undefined}
            className={`h-7 rounded-md px-2 text-[11px] font-semibold transition-colors ${
              mode === option.value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-700'
            } ${isTradesModeDisabled && option.value === 'trades' ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 rounded-lg bg-gray-100 p-1">
        {MOVING_AVERAGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onMovingAverageWindowChange(option.value)}
            disabled={mode === 'trades' && option.value !== 'off'}
            className={`h-7 rounded-md px-2 text-[11px] font-semibold transition-colors ${
              movingAverageWindow === option.value
                ? 'bg-white text-amber-600 shadow-sm'
                : mode === 'trades' && option.value !== 'off'
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
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
