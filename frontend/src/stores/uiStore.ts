import { create } from 'zustand'

type ToastType = 'success' | 'info' | 'error'

type ToastState = {
  id:      number
  message: string
  type:    ToastType
}

export type TradePeriod = '1m' | '3m' | '6m' | '12m' | 'custom'
export type AuthSheetAction = 'write' | 'comment' | 'like' | 'favorite'

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
  authSheetAction:        AuthSheetAction
  openAuthSheet:          (action?: AuthSheetAction) => void
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
  setSearchKeyword:       (searchKeyword) => set({ searchKeyword: searchKeyword?.trim() || null }),
  isAuthSheetOpen:        false,
  authSheetAction:        'write',
  // Keep the blocked action so the auth CTA can match write/comment/like flows.
  openAuthSheet:          (authSheetAction = 'write') => set({ isAuthSheetOpen: true, authSheetAction }),
  closeAuthSheet:         () => set({ isAuthSheetOpen: false }),
  toast:                  null,
  showToast: (message, type = 'info') =>
    set({ toast: { id: Date.now(), message, type } }),
  clearToast: () => set({ toast: null }),
  // searchKeyword 초기화 (category/sortType은 postStore.resetFilters()와 함께 호출)
  resetCommunityFilters: () => set({ searchKeyword: null }),
}))
