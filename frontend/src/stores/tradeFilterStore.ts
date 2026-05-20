import { create } from 'zustand'

type PriceRange = 'UNDER_10' | '10_20' | 'OVER_20' | null
type DealType   = 'SALE' | 'JEONSE' | 'MONTHLY' | null
type AreaRange  = '20' | '30' | '40' | null
type QuickPreset = 'NEW' | 'LARGE' | 'HOT' | null
type FloorBand = 'LOW' | 'MID' | 'HIGH' | null
type YearBand = 'NEW_0_10' | 'MID_11_20' | 'OLD_21_PLUS' | null

type TradeFilterState = {
  aptId:       string | null

  priceRange:  PriceRange
  dealType:    DealType
  areaRange:   AreaRange
  preset:      QuickPreset
  floorBand:   FloorBand
  yearBand:    YearBand
  complexKeyword: string | null
  excludeOutliers: boolean
  resultCount: number | null

  setAptId:      (aptId: string | null) => void
  setPriceRange: (range: PriceRange) => void
  setDealType:   (type: DealType) => void
  setAreaRange:  (area: AreaRange) => void
  setPreset:     (preset: QuickPreset) => void
  setFloorBand:  (floorBand: FloorBand) => void
  setYearBand:   (yearBand: YearBand) => void
  setComplexKeyword: (complexKeyword: string | null) => void
  setExcludeOutliers: (exclude: boolean) => void
  setResultCount: (count: number | null) => void
  resetFilters:  () => void
}

export const useTradeFilterStore = create<TradeFilterState>((set) => ({
  aptId:       null,
  priceRange:  null,
  dealType:    null,
  areaRange:   null,
  preset:      null,
  floorBand:   null,
  yearBand:    null,
  complexKeyword: null,
  excludeOutliers: false,
  resultCount: null,

  setAptId:      (aptId) => set({ aptId }),
  setPriceRange: (priceRange) => set({ priceRange, aptId: null }),
  setDealType:   (dealType)   => set({ dealType,   aptId: null }),
  setAreaRange:  (areaRange)  => set({ areaRange,  aptId: null }),
  setPreset:     (preset) => set({ preset, aptId: null }),
  setFloorBand:  (floorBand) => set({ floorBand, aptId: null }),
  setYearBand:   (yearBand) => set({ yearBand, aptId: null }),
  setComplexKeyword: (complexKeyword) => set({ complexKeyword, aptId: null }),
  setExcludeOutliers: (excludeOutliers) => set({ excludeOutliers }),
  setResultCount: (resultCount) => set({ resultCount }),
  resetFilters:  () => set({
    aptId: null,
    priceRange: null,
    dealType: null,
    areaRange: null,
    preset: null,
    floorBand: null,
    yearBand: null,
    complexKeyword: null,
    excludeOutliers: false,
  }),
}))
