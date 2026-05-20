import { create } from 'zustand'

type ToastType = 'success' | 'info' | 'error'

type ToastState = {
  id:      number
  message: string
  type:    ToastType
}

export type TradePeriod = '1m' | '3m' | '6m' | '12m' | 'custom'

type UiStore = {
  selectedApartmentId:    number | null
  setSelectedApartmentId: (id: number | null) => void
  tradePeriod:            TradePeriod
  setTradePeriod:         (p: TradePeriod) => void
  tradeCustomStartDate:   string | null
  tradeCustomEndDate:     string | null
  setTradeCustomDateRange: (startDate: string | null, endDate: string | null) => void
  searchKeyword:          string | null
  setSearchKeyword:       (kw: string | null) => void
  isAuthSheetOpen:        boolean
  openAuthSheet:          () => void
  closeAuthSheet:         () => void
  toast:                  ToastState | null
  showToast:              (message: string, type?: ToastType) => void
  clearToast:             () => void
  resetCommunityFilters:  () => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedApartmentId:    null,
  setSelectedApartmentId: (selectedApartmentId) => set({ selectedApartmentId }),
  tradePeriod:            '1m',
  setTradePeriod:         (tradePeriod) => set({ tradePeriod }),
  tradeCustomStartDate:   null,
  tradeCustomEndDate:     null,
  setTradeCustomDateRange: (tradeCustomStartDate, tradeCustomEndDate) =>
    set({ tradeCustomStartDate, tradeCustomEndDate }),
  searchKeyword:          null,
  setSearchKeyword:       (searchKeyword) => set({ searchKeyword }),
  isAuthSheetOpen:        false,
  openAuthSheet:          () => set({ isAuthSheetOpen: true }),
  closeAuthSheet:         () => set({ isAuthSheetOpen: false }),
  toast:                  null,
  showToast: (message, type = 'info') =>
    set({ toast: { id: Date.now(), message, type } }),
  clearToast: () => set({ toast: null }),
  // searchKeyword 초기화 (category/sortType은 postStore.resetFilters()와 함께 호출)
  resetCommunityFilters: () => set({ searchKeyword: null }),
}))
