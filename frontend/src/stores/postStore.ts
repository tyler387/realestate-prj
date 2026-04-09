import { create } from 'zustand'
import type { Post, Category, SortType } from '../types'
import { mockPosts } from '../data/mockData'

type PostStore = {
  posts: Post[]
  selectedCategory: Category
  sortType: SortType
  setCategory: (category: Category) => void
  setSortType: (sort: SortType) => void
  toggleLike: (postId: number) => void
}

export const usePostStore = create<PostStore>((set) => ({
  posts: mockPosts,
  selectedCategory: '전체',
  sortType: '최신순',
  setCategory: (selectedCategory) => set({ selectedCategory }),
  setSortType: (sortType) => set({ sortType }),
  toggleLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      ),
    })),
}))
