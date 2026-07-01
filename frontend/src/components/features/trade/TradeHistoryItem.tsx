import { type TradeRecord } from '../../../types/trade'
import { formatPrice } from '../../../utils/formatPrice'

const BADGE_STYLES: Record<'매매' | '전세' | '월세', string> = {
  매매: 'border-red-100 bg-red-50 text-market-sale',
  전세: 'border-blue-100 bg-blue-50 text-market-jeonse',
  월세: 'border-emerald-100 bg-emerald-50 text-market-rent',
}

const formatTradePrice = (record: TradeRecord): string => {
  if (record.tradeType === '월세') {
    return `${formatPrice(record.deposit ?? 0)} / 월 ${record.monthlyRent ?? 0}만`
  }
  return formatPrice(record.price)
}

type Props = { record: TradeRecord }

export const TradeHistoryItem = ({ record }: Props) => {
  const details = [
    record.buildingName,
    record.area > 0 ? `전용 ${record.area}㎡` : null,
    record.floor !== '-' ? `${record.floor}층` : null,
  ].filter(Boolean)

  return (
    <div className="border-b border-line-base bg-surface-base px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${BADGE_STYLES[record.tradeType]}`}>
          {record.tradeType}
        </span>
        <span className="text-xs font-medium text-text-subtle">{record.contractDate}</span>
      </div>
      <p className="mt-1 text-base font-black text-text-strong tabular-nums">{formatTradePrice(record)}</p>
      {details.length > 0 && (
        <p className="mt-0.5 text-xs font-medium text-text-subtle">{details.join(' · ')}</p>
      )}
    </div>
  )
}
