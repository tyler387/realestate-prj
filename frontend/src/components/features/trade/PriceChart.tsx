import { useState } from 'react'
import { type PriceHistory } from '../../../types/trade'
import { type TradeType } from './TradeTypeFilter'
import { formatPrice } from '../../../utils/formatPrice'

type Props = {
  data: PriceHistory[]
  tradeType: TradeType
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 100
const PADDING = { top: 16, bottom: 24, left: 8, right: 8 }

export const PriceChart = ({ data, tradeType }: Props) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; price: number; month: string } | null>(null)

  const targetType = tradeType === 'all' ? '매매' : tradeType
  const filtered = data.filter((d) => d.tradeType === targetType).slice(-6)

  if (filtered.length === 0) {
    return (
      <div className="mx-4 my-3 flex h-40 items-center justify-center rounded-xl bg-white p-4">
        <span className="text-sm text-gray-400">차트 데이터가 없습니다</span>
      </div>
    )
  }

  const prices = filtered.map((d) => d.avgPrice)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const toX = (i: number) => PADDING.left + (i / (filtered.length - 1)) * innerWidth
  const toY = (price: number) => PADDING.top + (1 - (price - minPrice) / priceRange) * innerHeight

  const points = filtered.map((d, i) => ({ x: toX(i), y: toY(d.avgPrice), price: d.avgPrice, month: d.month }))
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-gray-700">
        📈 월별 평균 시세 ({targetType})
      </p>
      <div className="relative h-40">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-full w-full"
          onMouseLeave={() => setTooltip(null)}
        >
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={5}
                fill="white"
                stroke="#3b82f6"
                strokeWidth="2"
                className="cursor-pointer"
                onMouseEnter={() => setTooltip(p)}
              />
              <text
                x={p.x}
                y={CHART_HEIGHT - 4}
                textAnchor="middle"
                className="text-[8px]"
                fontSize="8"
                fill="#9ca3af"
              >
                {p.month}
              </text>
            </g>
          ))}
        </svg>
        {tooltip && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded bg-gray-800 px-2 py-1 text-xs text-white"
            style={{ left: (tooltip.x / CHART_WIDTH) * 100 + '%', top: (tooltip.y / CHART_HEIGHT) * 100 + '%' }}
          >
            {formatPrice(tooltip.price)}
          </div>
        )}
      </div>
    </div>
  )
}
