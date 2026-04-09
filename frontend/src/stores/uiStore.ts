import { create } from 'zustand'

type UiStore = {
  selectedApartmentId: number | null
  setSelectedApartmentId: (id: number | null) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedApartmentId: null,
  setSelectedApartmentId: (selectedApartmentId) => set({ selectedApartmentId }),
}))
