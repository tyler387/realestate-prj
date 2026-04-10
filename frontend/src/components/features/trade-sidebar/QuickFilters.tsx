import { useTradeFilterStore } from '../../../stores/tradeFilterStore'
import { SidebarCard, CardTitle } from '../sidebar/SidebarCard'
import { FilterGroup } from './FilterGroup'
import { FilterChip } from './FilterChip'

const PRICE_RANGE_OPTIONS = [
  { label: '~10억',   value: 'UNDER_10' as const },
  { label: '10~20억', value: '10_20'    as const },
  { label: '20억+',   value: 'OVER_20'  as const },
]

const DEAL_TYPE_OPTIONS = [
  { label: '매매', value: 'SALE'    as const },
  { label: '전세', value: 'JEONSE' as const },
  { label: '월세', value: 'MONTHLY' as const },
]

const AREA_RANGE_OPTIONS = [
  { label: '20평대', value: '20' as const },
  { label: '30평대', value: '30' as const },
  { label: '40평대', value: '40' as const },
]

export const QuickFilters = () => {
  const {
    priceRange, dealType, areaRange,
    setPriceRange, setDealType, setAreaRange, resetFilters,
  } = useTradeFilterStore()

  return (
    <SidebarCard>
      <CardTitle>🏷 빠른 필터</CardTitle>

      <FilterGroup label="가격대">
        {PRICE_RANGE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            isSelected={priceRange === opt.value}
            onClick={() => setPriceRange(priceRange === opt.value ? null : opt.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="거래 유형">
        {DEAL_TYPE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            isSelected={dealType === opt.value}
            onClick={() => setDealType(dealType === opt.value ? null : opt.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="면적">
        {AREA_RANGE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            isSelected={areaRange === opt.value}
            onClick={() => setAreaRange(areaRange === opt.value ? null : opt.value)}
          />
        ))}
      </FilterGroup>

      <button
        onClick={resetFilters}
        className="ml-auto mt-3 block text-xs text-gray-400 transition-colors hover:text-gray-600"
      >
        필터 초기화
      </button>
    </SidebarCard>
  )
}
