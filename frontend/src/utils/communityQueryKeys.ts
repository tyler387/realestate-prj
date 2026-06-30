import type { QueryClient } from '@tanstack/react-query'

export const communityQueryKeys = {
  posts: () => ['community', 'posts'] as const,
  post: (postId: number) => ['community', 'post', postId] as const,
  comments: (postId: number) => ['community', 'comments', postId] as const,
  keywords: () => ['community', 'keywords'] as const,
  popular: () => ['community', 'popular'] as const,
  hotComments: () => ['community', 'hotComments'] as const,
  myPosts: () => ['community', 'my-posts'] as const,
  myComments: () => ['community', 'my-comments'] as const,
}

const invalidate = (queryClient: QueryClient, queryKey: readonly unknown[]) =>
  queryClient.invalidateQueries({ queryKey })

export const invalidateCommunityLists = (queryClient: QueryClient) =>
  Promise.all([
    invalidate(queryClient, communityQueryKeys.posts()),
    invalidate(queryClient, communityQueryKeys.popular()),
    invalidate(queryClient, communityQueryKeys.hotComments()),
  ])

export const invalidateCommunityStats = (queryClient: QueryClient) =>
  Promise.all([
    invalidate(queryClient, communityQueryKeys.popular()),
    invalidate(queryClient, communityQueryKeys.hotComments()),
  ])

export const invalidatePostDetail = (queryClient: QueryClient, postId: number) =>
  Promise.all([
    invalidate(queryClient, communityQueryKeys.post(postId)),
    invalidate(queryClient, communityQueryKeys.comments(postId)),
  ])

export const invalidateMyCommunity = (queryClient: QueryClient) =>
  Promise.all([
    invalidate(queryClient, communityQueryKeys.myPosts()),
    invalidate(queryClient, communityQueryKeys.myComments()),
  ])

export const invalidateAfterPostCreate = (queryClient: QueryClient) =>
  Promise.all([
    invalidateCommunityLists(queryClient),
    invalidate(queryClient, communityQueryKeys.keywords()),
    invalidate(queryClient, communityQueryKeys.myPosts()),
  ])
