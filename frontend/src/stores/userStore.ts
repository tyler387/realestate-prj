import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthStatus } from '../types'
import { tokenStorage } from '../services/authService'

type UserState = {
  userId:                 number | null
  nickname:               string | null
  status:                 AuthStatus
  apartmentId:            number | null
  apartmentName:          string | null
  verifiedApartmentId:    number | null
  verifiedApartmentName:  string | null
  oauthProvider:          string | null   // 'KAKAO' 등 소셜 로그인 제공자
  setUser: (user: Partial<Omit<UserState, 'setUser' | 'logout'>>) => void
  logout:  () => void
}

const initialState = {
  userId:                 null,
  nickname:               null,
  status:                 'GUEST' as AuthStatus,
  apartmentId:            null,
  apartmentName:          null,
  verifiedApartmentId:    null,
  verifiedApartmentName:  null,
  oauthProvider:          null,
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set((state) => ({ ...state, ...user })),
      logout:  () => {
        tokenStorage.remove()
        set({ ...initialState })
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        userId:                state.userId,
        nickname:              state.nickname,
        status:                state.status,
        apartmentId:           state.apartmentId,
        apartmentName:         state.apartmentName,
        verifiedApartmentId:   state.verifiedApartmentId,
        verifiedApartmentName: state.verifiedApartmentName,
        oauthProvider:         state.oauthProvider,
      }) as UserState,
    }
  )
)
