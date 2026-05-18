import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CategoryFilter } from '../components/features/community/CategoryFilter'
import { SortDropdown } from '../components/features/community/SortDropdown'
import { PostList } from '../components/features/community/PostList'
import { GuestBanner } from '../components/common/GuestBanner'
import { AptSelectPromptBanner } from '../components/features/community/AptSelectPromptBanner'
import { MobileApartmentTrigger } from '../components/features/apartment-select/MobileApartmentTrigger'
import { ApartmentSelectModal } from '../components/features/apartment-select/ApartmentSelectModal'
import { ApartmentInfoCard } from '../components/features/sidebar/ApartmentInfoCard'
import { TrendingKeywords } from '../components/features/sidebar/TrendingKeywords'
import { PopularPosts } from '../components/features/sidebar/PopularPosts'
import { MostCommentedPosts } from '../components/features/sidebar/MostCommentedPosts'
import { EmptyState } from '../components/common/EmptyState'
import { PostCardSkeleton } from '../components/common/Skeleton'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'
import { usePostStore } from '../stores/postStore'
import { fetchPosts } from '../services/communityService'

export const CommunityPage = () => {
  const { apartmentId, status } = useUserStore()
  const { selectedCategory, sortType, resetFilters } = usePostStore()
  const { searchKeyword, setSearchKeyword, resetCommunityFilters } = useUiStore()

  const [isBannerVisible, setIsBannerVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const prevAptIdRef = useRef<number | null | undefined>(undefined)

  useEffect(() => {
    if (prevAptIdRef.current === undefined) {
      prevAptIdRef.current = apartmentId
      return
    }
    if (prevAptIdRef.current !== apartmentId) {
      prevAptIdRef.current = apartmentId
      resetCommunityFilters()
      resetFilters()
      setIsBannerVisible(true)
    }
  }, [apartmentId, resetCommunityFilters, resetFilters])

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['community', 'posts', apartmentId, selectedCategory, sortType],
    queryFn: () => fetchPosts(apartmentId, selectedCategory, sortType),
    enabled: apartmentId != null,
    staleTime: 1000 * 60 * 5,
  })

  const filteredPosts = searchKeyword
    ? posts.filter((p) => p.title.includes(searchKeyword) || p.content.includes(searchKeyword))
    : posts

  const renderBanner = () => {
    if (apartmentId == null) {
      return <AptSelectPromptBanner />
    }
    if (status === 'GUEST' && isBannerVisible) {
      return <GuestBanner isVisible={isBannerVisible} onClose={() => setIsBannerVisible(false)} />
    }
    return null
  }

  const renderFeed = () => {
    if (apartmentId == null) return null
    if (isLoading) return <PostCardSkeleton />
    if (isError) return <EmptyState icon="⚠️" title="데이터를 불러올 수 없습니다" />
    if (filteredPosts.length === 0) {
      return (
        <EmptyState
          icon="📭"
          title={searchKeyword ? `'${searchKeyword}' 관련 게시글이 없습니다` : '아직 게시글이 없습니다'}
        />
      )
    }
    return <PostList posts={filteredPosts} />
  }

  const aptId = apartmentId != null ? String(apartmentId) : ''

  return (
    <div className="flex flex-col pb-24">
      {renderBanner()}

      <div className="px-4 pt-3">
        <MobileApartmentTrigger onClick={() => setIsModalOpen(true)} />
      </div>

      <CategoryFilter />

      {searchKeyword && (
        <div className="flex items-center gap-2 px-4 pb-2">
          <span className="text-xs text-gray-500">검색 필터:</span>
          <span className="flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs text-white">
            {searchKeyword}
            <button
              onClick={() => setSearchKeyword(null)}
              className="ml-1 font-bold leading-none hover:opacity-70"
              aria-label="검색 필터 해제"
            >
              ×
            </button>
          </span>
        </div>
      )}

      <SortDropdown />

      {renderFeed()}

      {apartmentId != null && (
        <section className="space-y-3 px-4 pt-4 lg:hidden">
          <ApartmentInfoCard aptId={aptId} />
          <TrendingKeywords aptId={aptId} />
          <PopularPosts aptId={aptId} />
          <MostCommentedPosts aptId={aptId} />
        </section>
      )}

      {isModalOpen && <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}
