import { type TradeRecord } from '../../../types/trade'
import { type TradeType } from './TradeTypeFilter'
import { TradeHistoryItem } from './TradeHistoryItem'
import { EmptyState } from '../../common/EmptyState'

type Props = {
  records: TradeRecord[]
  selectedType: TradeType
  selectedArea?: number | null
  limit?: number
  hasMore?: boolean
}

const isSameArea = (left: number, right: number | null | undefined) =>
  right == null || Math.abs(left - right) < 0.0001

export const TradeHistoryList = ({ records, selectedType, selectedArea, limit, hasMore = false }: Props) => {
  const filtered = records
    .filter((record) => selectedType === 'all' || record.tradeType === selectedType)
    .filter((record) => isSameArea(record.area, selectedArea))

  if (filtered.length === 0) {
    return <EmptyState icon="거래" title="조건에 맞는 실거래가 없습니다" />
  }

  return (
    <div>
      {hasMore && limit != null && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          조회 성능을 위해 최근 거래 {limit.toLocaleString()}건까지 표시합니다. 기간이나 필터를 좁히면 더 정확히 볼 수 있습니다.
        </div>
      )}
      {filtered.map((record) => (
        <TradeHistoryItem key={record.id} record={record} />
      ))}
    </div>
  )
}
