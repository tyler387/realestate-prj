import { useQuery } from '@tanstack/react-query'
import {
  mockApartmentSummary,
  mockTrendingKeywords,
  mockPopularPosts,
  mockMostCommentedPosts,
  type ApartmentSummary,
  type PopularPost,
  type MostCommentedPost,
} from '../data/mockSidebarData'

const USE_MOCK = true

const QUERY_KEYS = {
  apartmentSummary: (aptId: string) => ['apartment', 'summary', aptId],
  trendingKeywords: (aptId: string) => ['community', 'keywords', aptId],
  popularPosts:     (aptId: string) => ['community', 'popular', aptId],
  mostCommented:    (aptId: string) => ['community', 'hotComments', aptId],
}

export const useApartmentSummary = (aptId: string) =>
  useQuery<ApartmentSummary>({
    queryKey: QUERY_KEYS.apartmentSummary(aptId),
    queryFn: () => fetch(`/api/apartment/${aptId}/summary`).then((r) => r.json()),
    enabled: !USE_MOCK,
    initialData: USE_MOCK ? mockApartmentSummary : undefined,
    staleTime: 1000 * 60 * 60,
    gcTime:    1000 * 60 * 120,
  })

export const useTrendingKeywords = (aptId: string) =>
  useQuery<string[]>({
    queryKey: QUERY_KEYS.trendingKeywords(aptId),
    queryFn: () => fetch(`/api/community/${aptId}/keywords`).then((r) => r.json()),
    enabled: !USE_MOCK,
    initialData: USE_MOCK ? mockTrendingKeywords : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })

export const usePopularPosts = (aptId: string) =>
  useQuery<PopularPost[]>({
    queryKey: QUERY_KEYS.popularPosts(aptId),
    queryFn: () => fetch(`/api/community/${aptId}/posts/popular`).then((r) => r.json()),
    enabled: !USE_MOCK,
    initialData: USE_MOCK ? mockPopularPosts : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })

export const useMostCommentedPosts = (aptId: string) =>
  useQuery<MostCommentedPost[]>({
    queryKey: QUERY_KEYS.mostCommented(aptId),
    queryFn: () => fetch(`/api/community/${aptId}/posts/hot-comments`).then((r) => r.json()),
    enabled: !USE_MOCK,
    initialData: USE_MOCK ? mockMostCommentedPosts : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
