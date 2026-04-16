import { create } from 'zustand'
import type { Category, SortType } from '../types'

type PostStore = {
  selectedCategory: Category
  sortType:         SortType
  setCategory:      (category: Category) => void
  setSortType:      (sort: SortType) => void
  resetFilters:     () => void
}

export const usePostStore = create<PostStore>((set) => ({
  selectedCategory: '전체',
  sortType:         '최신순',
  setCategory:      (selectedCategory) => set({ selectedCategory }),
  setSortType:      (sortType)         => set({ sortType }),
  resetFilters:     () => set({ selectedCategory: '전체', sortType: '최신순' }),
}))
