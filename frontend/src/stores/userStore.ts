import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthStatus } from '../types'

type UserState = {
  userId:        number | null
  nickname:      string | null
  status:        AuthStatus
  apartmentId:   number | null
  apartmentName: string | null
  setUser: (user: Partial<Omit<UserState, 'setUser' | 'logout'>>) => void
  logout:  () => void
}

const initialState = {
  userId:        null,
  nickname:      null,
  status:        'GUEST' as AuthStatus,
  apartmentId:   null,
  apartmentName: null,
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set((state) => ({ ...state, ...user })),
      logout:  () => set({ ...initialState }),
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        // 새로고침 후 status + 아파트 정보 복원 (userId/nickname은 세션 기반 제외)
        status:        state.status,
        apartmentId:   state.apartmentId,
        apartmentName: state.apartmentName,
      }) as UserState,
    }
  )
)
