import { type TradeRecord } from '../../../types/trade'
import { type TradeType } from './TradeTypeFilter'
import { TradeHistoryItem } from './TradeHistoryItem'
import { EmptyState } from '../../common/EmptyState'

type Props = {
  records: TradeRecord[]
  selectedType: TradeType
  selectedArea?: number | null
}

const isSameArea = (left: number, right: number | null | undefined) =>
  right == null || Math.abs(left - right) < 0.0001

export const TradeHistoryList = ({ records, selectedType, selectedArea }: Props) => {
  const filtered = records
    .filter((record) => selectedType === 'all' || record.tradeType === selectedType)
    .filter((record) => isSameArea(record.area, selectedArea))

  if (filtered.length === 0) {
    return <EmptyState icon="거래" title="해당 조건의 거래 내역이 없습니다" />
  }

  return (
    <div>
      {filtered.map((record) => (
        <TradeHistoryItem key={record.id} record={record} />
      ))}
    </div>
  )
}
