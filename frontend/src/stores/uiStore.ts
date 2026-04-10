import { create } from 'zustand'

type ToastType = 'success' | 'info' | 'error'

type ToastState = {
  id: number
  message: string
  type: ToastType
}

type UiStore = {
  selectedApartmentId: number | null
  setSelectedApartmentId: (id: number | null) => void
  tradePeriod: '1d' | '1w' | '1m'
  setTradePeriod: (p: '1d' | '1w' | '1m') => void
  searchKeyword: string | null
  setSearchKeyword: (kw: string | null) => void
  isAuthSheetOpen: boolean
  openAuthSheet: () => void
  closeAuthSheet: () => void
  toast: ToastState | null
  showToast: (message: string, type?: ToastType) => void
  clearToast: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedApartmentId: null,
  setSelectedApartmentId: (selectedApartmentId) => set({ selectedApartmentId }),
  tradePeriod: '1m',
  setTradePeriod: (tradePeriod) => set({ tradePeriod }),
  searchKeyword: null,
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
  isAuthSheetOpen: false,
  openAuthSheet: () => set({ isAuthSheetOpen: true }),
  closeAuthSheet: () => set({ isAuthSheetOpen: false }),
  toast: null,
  showToast: (message, type = 'info') =>
    set({
      toast: {
        id: Date.now(),
        message,
        type,
      },
    }),
  clearToast: () => set({ toast: null }),
}))
