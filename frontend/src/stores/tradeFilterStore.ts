import { create } from 'zustand'

type PriceRange = 'UNDER_10' | '10_20' | 'OVER_20' | null
type DealType   = 'SALE' | 'JEONSE' | 'MONTHLY' | null
type AreaRange  = '20' | '30' | '40' | null

type TradeFilterState = {
  regionId:    string
  subRegionId: string | null
  aptId:       string | null

  priceRange:  PriceRange
  dealType:    DealType
  areaRange:   AreaRange

  setRegion:     (regionId: string, subRegionId?: string) => void
  setAptId:      (aptId: string | null) => void
  setPriceRange: (range: PriceRange) => void
  setDealType:   (type: DealType) => void
  setAreaRange:  (area: AreaRange) => void
  resetFilters:  () => void
}

export const useTradeFilterStore = create<TradeFilterState>((set) => ({
  regionId:    'seoul-songpa',
  subRegionId: null,
  aptId:       null,
  priceRange:  null,
  dealType:    null,
  areaRange:   null,

  setRegion:     (regionId, subRegionId) => set({ regionId, subRegionId: subRegionId ?? null }),
  setAptId:      (aptId) => set({ aptId }),
  setPriceRange: (priceRange) => set({ priceRange, aptId: null }),
  setDealType:   (dealType)   => set({ dealType,   aptId: null }),
  setAreaRange:  (areaRange)  => set({ areaRange,  aptId: null }),
  resetFilters:  () => set({ aptId: null, priceRange: null, dealType: null, areaRange: null }),
}))
