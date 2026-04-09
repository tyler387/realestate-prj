import { create } from 'zustand'
import type { User } from '../types'
import { mockUser } from '../data/mockData'

type UserStore = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: mockUser,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
