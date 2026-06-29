import { type TradeRecord } from '../../../types/trade'
import { formatPrice } from '../../../utils/formatPrice'

const BADGE_STYLES: Record<'매매' | '전세' | '월세', string> = {
  매매: 'bg-red-50 text-red-500',
  전세: 'bg-blue-50 text-blue-500',
  월세: 'bg-green-50 text-green-500',
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
    <div className="border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs ${BADGE_STYLES[record.tradeType]}`}>
          {record.tradeType}
        </span>
        <span className="text-xs text-gray-400">{record.contractDate}</span>
      </div>
      <p className="mt-1 text-base font-bold text-gray-900">{formatTradePrice(record)}</p>
      {details.length > 0 && (
        <p className="mt-0.5 text-xs text-gray-400">{details.join(' · ')}</p>
      )}
    </div>
  )
}
