import { create } from 'zustand'
import type { AuthStatus } from '../types'

type UserState = {
  userId: number | null
  nickname: string | null
  status: AuthStatus
  apartmentId: number | null
  apartmentName: string | null
  setUser: (user: Partial<Omit<UserState, 'setUser' | 'logout'>>) => void
  logout: () => void
}

const initialState = {
  userId: null,
  nickname: null,
  status: 'GUEST' as AuthStatus,
  apartmentId: null,
  apartmentName: null,
}

export const useUserStore = create<UserState>((set) => ({
  ...initialState,
  setUser: (user) =>
    set((state) => ({
      ...state,
      ...user,
    })),
  logout: () => set(initialState),
}))
