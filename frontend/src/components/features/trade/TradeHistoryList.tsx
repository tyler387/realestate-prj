import { type TradeRecord } from '../../../data/mockTradeData'
import { type TradeType } from './TradeTypeFilter'
import { useTradeFilterStore } from '../../../stores/tradeFilterStore'
import { TradeHistoryItem } from './TradeHistoryItem'
import { EmptyState } from '../../common/EmptyState'

const DEAL_TYPE_MAP: Record<'SALE' | 'JEONSE' | 'MONTHLY', '매매' | '전세' | '월세'> = {
  SALE:    '매매',
  JEONSE:  '전세',
  MONTHLY: '월세',
}

type Props = {
  records: TradeRecord[]
  selectedType: TradeType
}

export const TradeHistoryList = ({ records, selectedType }: Props) => {
  const { priceRange, dealType, areaRange } = useTradeFilterStore()

  const filtered = records
    .filter((r) => selectedType === 'all' || r.tradeType === selectedType)
    .filter((r) => {
      if (!priceRange) return true
      if (priceRange === 'UNDER_10') return r.price < 100000
      if (priceRange === '10_20')    return r.price >= 100000 && r.price <= 200000
      if (priceRange === 'OVER_20')  return r.price > 200000
      return true
    })
    .filter((r) => {
      if (!dealType) return true
      return r.tradeType === DEAL_TYPE_MAP[dealType]
    })
    .filter((r) => {
      if (!areaRange) return true
      if (areaRange === '20') return r.area >= 59  && r.area < 82
      if (areaRange === '30') return r.area >= 82  && r.area < 115
      if (areaRange === '40') return r.area >= 115
      return true
    })

  if (filtered.length === 0) {
    return <EmptyState icon="📭" title="해당 유형의 거래 내역이 없어요" />
  }

  return (
    <div>
      {filtered.map((r) => (
        <TradeHistoryItem key={r.id} record={r} />
      ))}
    </div>
  )
}
