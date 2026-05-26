import { create } from 'zustand'
import type { BoardCode, Category, CommunityScope, SortType } from '../types'
import {
  DEFAULT_COMMUNITY_SCOPE,
  DEFAULT_GLOBAL_BOARD,
  DEFAULT_SORT_TYPE,
  defaultBoardForScope,
} from '../constants/communityBoards'

type PostStore = {
  scope:            CommunityScope
  boardCode:        BoardCode
  selectedCategory: Category
  sortType:         SortType
  setScope:         (scope: CommunityScope) => void
  setBoardCode:     (boardCode: BoardCode) => void
  setCategory:      (category: Category) => void
  setSortType:      (sort: SortType) => void
  setCommunityState: (state: Partial<Pick<PostStore, 'scope' | 'boardCode' | 'sortType'>>) => void
  resetFilters:     () => void
}

export const usePostStore = create<PostStore>((set) => ({
  scope:            DEFAULT_COMMUNITY_SCOPE,
  boardCode:        DEFAULT_GLOBAL_BOARD,
  selectedCategory: '전체',
  sortType:         DEFAULT_SORT_TYPE,
  setScope:         (scope) => set({
    scope,
    boardCode: defaultBoardForScope(scope),
    selectedCategory: '전체',
  }),
  setBoardCode:     (boardCode) => set({ boardCode, selectedCategory: '전체' }),
  setCategory:      (selectedCategory) => set({ selectedCategory }),
  setSortType:      (sortType)         => set({ sortType }),
  setCommunityState: (state) => set((current) => {
    const scope = state.scope ?? current.scope
    return {
      ...state,
      scope,
      boardCode: state.boardCode ?? current.boardCode,
      sortType: state.sortType ?? current.sortType,
      selectedCategory: '전체',
    }
  }),
  resetFilters:     () => set({
    scope: DEFAULT_COMMUNITY_SCOPE,
    boardCode: DEFAULT_GLOBAL_BOARD,
    selectedCategory: '전체',
    sortType: DEFAULT_SORT_TYPE,
  }),
}))
