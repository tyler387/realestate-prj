import type { Post } from '../types'

export const normalizeCommunitySearchKeyword = (keyword: string | null | undefined) => {
  const normalized = keyword?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

export const buildCommunitySearchContextKey = (
  scope: string,
  boardCode: string,
  aptId: number | null,
) => `${scope}:${boardCode}:${aptId ?? 'GLOBAL'}`

export const filterPostsByKeyword = (posts: Post[], keyword: string | null | undefined) => {
  const normalizedKeyword = normalizeCommunitySearchKeyword(keyword)
  if (!normalizedKeyword) return posts

  const lowerKeyword = normalizedKeyword.toLowerCase()
  return posts.filter((post) =>
    post.title.toLowerCase().includes(lowerKeyword)
    || post.content.toLowerCase().includes(lowerKeyword)
  )
}

// Search is intentionally not persisted in the URL for the MVP.
// Treat it as a board-local filter that resets when scope/board/apt changes.
// When the backend adds server search, pass this value as the q parameter.
export const toCommunitySearchQueryParam = (keyword: string | null | undefined) =>
  normalizeCommunitySearchKeyword(keyword)
