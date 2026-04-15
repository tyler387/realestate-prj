import { useMapFilterStore } from '../../../stores/mapFilterStore'
import { FilterChip } from './FilterChip'

export const FilterPanel = () => {
  const {
    dealType, minPrice, maxPrice, areaRange,
    setDealType, setMinPrice, setMaxPrice, setAreaRange, resetFilters,
  } = useMapFilterStore()

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                    flex flex-wrap items-center justify-center gap-2
                    bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg
                    max-w-[90%]">

      {/* 거래 유형 */}
      <FilterChip label="전체" isSelected={!dealType}
        onClick={() => setDealType(null)} />
      <FilterChip label="매매" isSelected={dealType === 'SALE'}
        onClick={() => setDealType(dealType === 'SALE' ? null : 'SALE')} />
      <FilterChip label="전세" isSelected={dealType === 'JEONSE'}
        onClick={() => setDealType(dealType === 'JEONSE' ? null : 'JEONSE')} />

      <span className="text-gray-200 select-none">|</span>

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

      <span className="text-gray-200 select-none">|</span>

      {/* 면적 */}
      <FilterChip label="20평대" isSelected={areaRange === '20'}
        onClick={() => setAreaRange(areaRange === '20' ? null : '20')} />
      <FilterChip label="30평대" isSelected={areaRange === '30'}
        onClick={() => setAreaRange(areaRange === '30' ? null : '30')} />
      <FilterChip label="40평대" isSelected={areaRange === '40'}
        onClick={() => setAreaRange(areaRange === '40' ? null : '40')} />

      <button
        onClick={resetFilters}
        className="text-xs text-gray-400 hover:text-gray-600 ml-1 transition-colors"
      >
        초기화
      </button>
    </div>
  )
}
