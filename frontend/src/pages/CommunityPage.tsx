import { useEffect, useRef, useState } from 'react'
import { useQuery }              from '@tanstack/react-query'
import { CategoryFilter }        from '../components/features/community/CategoryFilter'
import { SortDropdown }          from '../components/features/community/SortDropdown'
import { PostList }              from '../components/features/community/PostList'
import { GuestBanner }           from '../components/common/GuestBanner'
import { AptSelectPromptBanner } from '../components/features/community/AptSelectPromptBanner'
import { MobileApartmentTrigger } from '../components/features/apartment-select/MobileApartmentTrigger'
import { ApartmentSelectModal }  from '../components/features/apartment-select/ApartmentSelectModal'
import { EmptyState }            from '../components/common/EmptyState'
import { PostCardSkeleton }      from '../components/common/Skeleton'
import { useUserStore }          from '../stores/userStore'
import { useUiStore }            from '../stores/uiStore'
import { usePostStore }          from '../stores/postStore'
import { fetchPosts }            from '../services/communityService'

export const CommunityPage = () => {
  const { apartmentId, status } = useUserStore()
  const { selectedCategory, sortType, resetFilters } = usePostStore()
  const { searchKeyword, setSearchKeyword, resetCommunityFilters } = useUiStore()

  const [isBannerVisible, setIsBannerVisible] = useState(true)
  const [isModalOpen,     setIsModalOpen]     = useState(false)

  // ── aptId 변경 감지 (최초 마운트 제외) ─────────────────────────
  const prevAptIdRef = useRef<number | null | undefined>(undefined)

  useEffect(() => {
    if (prevAptIdRef.current === undefined) {
      // 최초 마운트 → 건너뜀
      prevAptIdRef.current = apartmentId
      return
    }
    if (prevAptIdRef.current !== apartmentId) {
      prevAptIdRef.current = apartmentId
      resetCommunityFilters()   // searchKeyword 초기화
      resetFilters()            // selectedCategory, sortType 초기화
      setIsBannerVisible(true)
    }
  }, [apartmentId])

  // ── React Query — 게시글 조회 ─────────────────────────────────
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey:  ['community', 'posts', apartmentId, selectedCategory, sortType],
    queryFn:   () => fetchPosts(apartmentId, selectedCategory, sortType),
    enabled:   apartmentId != null,
    staleTime: 1000 * 60 * 5,
  })

  // 키워드 필터: 제목 또는 본문에 키워드가 포함된 게시글만 표시
  const filteredPosts = searchKeyword
    ? posts.filter(
        (p) =>
          p.title.includes(searchKeyword) || p.content.includes(searchKeyword),
      )
    : posts

  // ── 배너 우선순위 렌더링 ──────────────────────────────────────
  const renderBanner = () => {
    if (apartmentId == null) {
      // 아파트 미선택 → 선택 유도 배너 우선
      return <AptSelectPromptBanner />
    }
    if (status === 'GUEST' && isBannerVisible) {
      // 아파트 선택됨 + GUEST → 로그인 유도 배너
      return <GuestBanner isVisible={isBannerVisible} onClose={() => setIsBannerVisible(false)} />
    }
    return null
  }

  // ── 피드 렌더링 ──────────────────────────────────────────────
  const renderFeed = () => {
    if (apartmentId == null) return null
    if (isLoading)           return <PostCardSkeleton />
    if (isError)             return <EmptyState icon="⚠️" title="데이터를 불러올 수 없습니다" />
    if (filteredPosts.length === 0)
      return (
        <EmptyState
          icon="🔍"
          title={
            searchKeyword
              ? `'${searchKeyword}' 관련 게시글이 없습니다`
              : '아직 게시글이 없습니다'
          }
        />
      )
    return <PostList posts={filteredPosts} />
  }

  return (
    <div className="flex flex-col pb-24">
      {renderBanner()}

      {/* 모바일 아파트 검색 트리거 (lg 미만에서만 표시) */}
      <div className="px-4 pt-3">
        <MobileApartmentTrigger onClick={() => setIsModalOpen(true)} />
      </div>

      <CategoryFilter />

      {/* 활성 키워드 필터 표시 */}
      {searchKeyword && (
        <div className="flex items-center gap-2 px-4 pb-2">
          <span className="text-xs text-gray-500">키워드 필터:</span>
          <span className="flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs text-white">
            {searchKeyword}
            <button
              onClick={() => setSearchKeyword(null)}
              className="ml-1 font-bold leading-none hover:opacity-70"
              aria-label="키워드 필터 해제"
            >
              ×
            </button>
          </span>
        </div>
      )}

      <SortDropdown />

      {renderFeed()}

      {isModalOpen && (
        <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
