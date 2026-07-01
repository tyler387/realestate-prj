import { useMapFilterStore } from '../../../stores/mapFilterStore'
import { FilterChip } from './FilterChip'

export const FilterPanel = () => {
  const {
    dealType, minPrice, maxPrice, areaRange,
    setDealType, setMinPrice, setMaxPrice, setAreaRange, resetFilters,
  } = useMapFilterStore()

  return (
    <div className="absolute left-1/2 top-4 z-10 flex max-w-[90%] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-line-base bg-surface-base/90 px-4 py-2 shadow-floating backdrop-blur-md">

      {/* 거래 유형 */}
      <FilterChip label="전체" isSelected={!dealType}
        onClick={() => setDealType(null)} />
      <FilterChip label="매매" isSelected={dealType === 'SALE'}
        onClick={() => setDealType(dealType === 'SALE' ? null : 'SALE')} />
      <FilterChip label="전세" isSelected={dealType === 'JEONSE'}
        onClick={() => setDealType(dealType === 'JEONSE' ? null : 'JEONSE')} />

      <span className="select-none text-line-strong">|</span>

      {/* 가격대 */}
      <FilterChip label="~10억"
        isSelected={maxPrice === 100000 && !minPrice}
        onClick={() => { setMinPrice(null); setMaxPrice(maxPrice === 100000 ? null : 100000) }} />
      <FilterChip label="10~20억"
        isSelected={minPrice === 100000 && maxPrice === 200000}
        onClick={() => {
          if (minPrice === 100000 && maxPrice === 200000) { setMinPrice(null); setMaxPrice(null) }
          else { setMinPrice(100000); setMaxPrice(200000) }
        }} />
      <FilterChip label="20억+"
        isSelected={minPrice === 200000 && !maxPrice}
        onClick={() => { setMinPrice(minPrice === 200000 ? null : 200000); setMaxPrice(null) }} />

      <span className="select-none text-line-strong">|</span>

      {/* 면적 */}
      <FilterChip label="20평대" isSelected={areaRange === '20'}
        onClick={() => setAreaRange(areaRange === '20' ? null : '20')} />
      <FilterChip label="30평대" isSelected={areaRange === '30'}
        onClick={() => setAreaRange(areaRange === '30' ? null : '30')} />
      <FilterChip label="40평대" isSelected={areaRange === '40'}
        onClick={() => setAreaRange(areaRange === '40' ? null : '40')} />

      <button
        onClick={resetFilters}
        className="ml-1 text-xs font-semibold text-text-subtle transition-colors hover:text-text-body"
      >
        초기화
      </button>
    </div>
  )
}
