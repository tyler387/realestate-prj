import { useQuery } from '@tanstack/react-query'
import type {
  ApartmentSummary,
  PopularPost,
  MostCommentedPost,
} from '../types/sidebar'
import type { BoardCode, CommunityScope } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

const QUERY_KEYS = {
  apartmentSummary: (aptId: string) => ['apartment', 'summary', aptId],
  trendingKeywords: (scope: CommunityScope, aptId: string, boardCode: BoardCode) =>
    ['community', 'keywords', scope, aptId, boardCode],
  popularPosts: (scope: CommunityScope, aptId: string, boardCode: BoardCode) =>
    ['community', 'popular', scope, aptId, boardCode],
  mostCommented: (scope: CommunityScope, aptId: string, boardCode: BoardCode) =>
    ['community', 'hotComments', scope, aptId, boardCode],
}

const communityParams = (scope: CommunityScope, aptId: string, boardCode: BoardCode) => {
  const params = new URLSearchParams({ scope, boardCode })
  if (scope === 'APARTMENT' && aptId) params.set('aptId', aptId)
  return params
}

export const useApartmentSummary = (aptId: string) =>
  useQuery<ApartmentSummary>({
    queryKey: QUERY_KEYS.apartmentSummary(aptId),
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/v1/apartments/${aptId}/summary`)
        .then((r) => r.json())
        .then((data) => ({
          aptId: String(data.id),
          aptName: data.complexName,
          location: data.location ?? '-',
          households: data.totalHouseholdCount ?? 0,
          builtYear: data.completionYear ?? 0,
          recentPrice: data.recentSalePrice ?? 0,
          recentSaleArea: data.recentSaleArea ?? null,
          recentTradeDate: data.recentTradeDate ?? null,
          recent30dTradeCount: data.recent30dTradeCount ?? 0,
        })),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
  })

export const useTrendingKeywords = (scope: CommunityScope, aptId: string, boardCode: BoardCode) =>
  useQuery<string[]>({
    queryKey: QUERY_KEYS.trendingKeywords(scope, aptId, boardCode),
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/community/keywords?${communityParams(scope, aptId, boardCode)}`).then((r) => r.json()),
    enabled: scope === 'GLOBAL' || !!aptId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

export const usePopularPosts = (scope: CommunityScope, aptId: string, boardCode: BoardCode) =>
  useQuery<PopularPost[]>({
    queryKey: QUERY_KEYS.popularPosts(scope, aptId, boardCode),
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/community/posts/popular?${communityParams(scope, aptId, boardCode)}`)
        .then((r) => r.json())
        .then((data: Array<{ id: number; title: string; likeCount: number; commentCount: number }>) =>
          data.map((p) => ({ postId: p.id, title: p.title, likeCount: p.likeCount, commentCount: p.commentCount }))
        ),
    enabled: scope === 'GLOBAL' || !!aptId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

export const useMostCommentedPosts = (scope: CommunityScope, aptId: string, boardCode: BoardCode) =>
  useQuery<MostCommentedPost[]>({
    queryKey: QUERY_KEYS.mostCommented(scope, aptId, boardCode),
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/community/posts/hot-comments?${communityParams(scope, aptId, boardCode)}`)
        .then((r) => r.json())
        .then((data: Array<{ id: number; title: string; commentCount: number }>) =>
          data.map((p) => ({ postId: p.id, title: p.title, commentCount: p.commentCount }))
        ),
    enabled: scope === 'GLOBAL' || !!aptId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
