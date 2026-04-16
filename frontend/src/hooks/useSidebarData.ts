import { useQuery } from '@tanstack/react-query'
import type {
  ApartmentSummary,
  PopularPost,
  MostCommentedPost,
} from '../types/sidebar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

const QUERY_KEYS = {
  apartmentSummary: (aptId: string) => ['apartment', 'summary', aptId],
  trendingKeywords: (aptId: string) => ['community', 'keywords', aptId],
  popularPosts:     (aptId: string) => ['community', 'popular', aptId],
  mostCommented:    (aptId: string) => ['community', 'hotComments', aptId],
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
        })),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
  })

export const useTrendingKeywords = (aptId: string) =>
  useQuery<string[]>({
    queryKey: QUERY_KEYS.trendingKeywords(aptId),
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/community/${aptId}/keywords`).then((r) => r.json()),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

export const usePopularPosts = (aptId: string) =>
  useQuery<PopularPost[]>({
    queryKey: QUERY_KEYS.popularPosts(aptId),
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/community/posts/popular?aptId=${aptId}`)
        .then((r) => r.json())
        .then((data: Array<{ id: number; title: string; likeCount: number; commentCount: number }>) =>
          data.map((p) => ({ postId: p.id, title: p.title, likeCount: p.likeCount, commentCount: p.commentCount }))
        ),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

export const useMostCommentedPosts = (aptId: string) =>
  useQuery<MostCommentedPost[]>({
    queryKey: QUERY_KEYS.mostCommented(aptId),
    queryFn: () =>
      fetch(`${API_BASE_URL}/api/community/posts/hot-comments?aptId=${aptId}`)
        .then((r) => r.json())
        .then((data: Array<{ id: number; title: string; commentCount: number }>) =>
          data.map((p) => ({ postId: p.id, title: p.title, commentCount: p.commentCount }))
        ),
    enabled: !!aptId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
