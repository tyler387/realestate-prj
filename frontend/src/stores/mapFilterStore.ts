import { create } from 'zustand'
import type { MapDealType, MapAreaRange } from '../types/map'

type MapFilterState = {
  dealType:  MapDealType
  minPrice:  number | null
  maxPrice:  number | null
  areaRange: MapAreaRange

  setDealType:  (v: MapDealType) => void
  setMinPrice:  (v: number | null) => void
  setMaxPrice:  (v: number | null) => void
  setAreaRange: (v: MapAreaRange) => void
  resetFilters: () => void
}

export const useMapFilterStore = create<MapFilterState>((set) => ({
  dealType:  null,
  minPrice:  null,
  maxPrice:  null,
  areaRange: null,

  setDealType:  (dealType)  => set({ dealType }),
  setMinPrice:  (minPrice)  => set({ minPrice }),
  setMaxPrice:  (maxPrice)  => set({ maxPrice }),
  setAreaRange: (areaRange) => set({ areaRange }),
  resetFilters: () => set({ dealType: null, minPrice: null, maxPrice: null, areaRange: null }),
}))
