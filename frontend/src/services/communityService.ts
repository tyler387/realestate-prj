import { USE_MOCK_POSTS } from '../config/featureFlags'
import { mockPosts }      from '../data/mockData'
import type { Post }      from '../types'

const fetchPostsMock = (
  aptId:    number,
  category: string,
  sortType: string
): Post[] => {
  // aptId 기준 필터링 (aptId 필드 없는 구 데이터는 제외)
  let posts = mockPosts.filter(p => p.aptId === aptId)

  // 카테고리 필터
  if (category !== '전체') {
    posts = posts.filter(p => p.category === category)
  }

  // 정렬
  if (sortType === '인기순') {
    posts = [...posts].sort(
      (a, b) => (b.likeCount * 2 + b.commentCount) - (a.likeCount * 2 + a.commentCount)
    )
  }

  return posts
}

export const fetchPosts = async (
  aptId:    number | null,
  category: string,
  sortType: string
): Promise<Post[]> => {
  if (aptId == null) return []

  if (USE_MOCK_POSTS) {
    await new Promise(r => setTimeout(r, 150))  // mock 딜레이
    return fetchPostsMock(aptId, category, sortType)
  }

  const params = new URLSearchParams({
    aptId:    String(aptId),
    category: category === '전체' ? '' : category,
    sortType,
  })
  const res  = await fetch(`/api/community/posts?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error?.message)
  return data.data as Post[]
}
