import { create } from 'zustand'
import type { Post, Category, SortType } from '../types'
import { mockPosts } from '../data/mockData'

type PostStore = {
  posts:            Post[]
  selectedCategory: Category
  sortType:         SortType
  setCategory:      (category: Category) => void
  setSortType:      (sort: SortType) => void
  toggleLike:       (postId: number) => void
  resetFilters:     () => void
}

export const usePostStore = create<PostStore>((set) => ({
  posts:            mockPosts,
  selectedCategory: '전체',
  sortType:         '최신순',
  setCategory:      (selectedCategory) => set({ selectedCategory }),
  setSortType:      (sortType)         => set({ sortType }),
  resetFilters:     () => set({ selectedCategory: '전체', sortType: '최신순' }),
  toggleLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, liked: !post.liked, likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1 }
          : post,
      ),
    })),
}))
