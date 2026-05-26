import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
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
import {
  DEFAULT_COMMUNITY_SCOPE,
  DEFAULT_SORT_TYPE,
  defaultBoardForScope,
  isBoardCodeForScope,
  isCommunityScope,
  isSortType,
} from '../constants/communityBoards'
import { buildCommunitySearchParams } from '../utils/communityUrl'

const toPositiveNumber = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export const CommunityPage = () => {
  const { apartmentId, apartmentName, status, setUser } = useUserStore()
  const { scope, boardCode, sortType, setCommunityState } = usePostStore()
  const { searchKeyword, setSearchKeyword, resetCommunityFilters } = useUiStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isBannerVisible, setIsBannerVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const prevAptIdRef = useRef<number | null | undefined>(undefined)
  const pendingUrlAptIdRef = useRef<number | null>(null)
  const pendingUserAptIdRef = useRef<number | null>(null)
  const searchParamKey = searchParams.toString()
  const rawScope = searchParams.get('scope')
  const urlScope = isCommunityScope(rawScope)
    ? rawScope
    : DEFAULT_COMMUNITY_SCOPE
  const rawBoardCode = searchParams.get('boardCode')
  const urlBoardCode = isBoardCodeForScope(urlScope, rawBoardCode)
    ? rawBoardCode
    : defaultBoardForScope(urlScope)
  const rawSortType = searchParams.get('sortType')
  const urlSortType = isSortType(rawSortType)
    ? rawSortType
    : DEFAULT_SORT_TYPE
  const urlAptId = toPositiveNumber(searchParams.get('aptId'))
  const shouldPreferUserAptId = pendingUserAptIdRef.current != null && apartmentId === pendingUserAptIdRef.current
  const activeAptId = scope === 'APARTMENT'
    ? shouldPreferUserAptId ? apartmentId : urlAptId ?? apartmentId
    : null

  useEffect(() => {
    if (scope !== urlScope || boardCode !== urlBoardCode || sortType !== urlSortType) {
      setCommunityState({ scope: urlScope, boardCode: urlBoardCode, sortType: urlSortType })
    }
  }, [boardCode, scope, setCommunityState, sortType, urlBoardCode, urlScope, urlSortType])

  useEffect(() => {
    if (
      pendingUserAptIdRef.current != null
      && apartmentId === pendingUserAptIdRef.current
      && urlAptId !== pendingUserAptIdRef.current
    ) {
      return
    }
    if (urlScope === 'APARTMENT' && urlAptId != null && apartmentId !== urlAptId) {
      pendingUrlAptIdRef.current = urlAptId
      setUser({
        apartmentId: urlAptId,
        apartmentName: apartmentId === urlAptId ? apartmentName : null,
      })
    }
  }, [apartmentId, apartmentName, setUser, urlAptId, urlScope])

  useEffect(() => {
    if (pendingUrlAptIdRef.current != null && apartmentId === pendingUrlAptIdRef.current) {
      pendingUrlAptIdRef.current = null
    }
  }, [apartmentId])

  useEffect(() => {
    if (pendingUserAptIdRef.current != null && urlAptId === pendingUserAptIdRef.current) {
      pendingUserAptIdRef.current = null
    }
  }, [urlAptId])

  useEffect(() => {
    if (scope !== urlScope || boardCode !== urlBoardCode || sortType !== urlSortType) return
    if (
      scope === 'APARTMENT'
      && urlAptId != null
      && apartmentId !== urlAptId
      && pendingUrlAptIdRef.current === urlAptId
    ) {
      return
    }

    const nextAptId = scope === 'APARTMENT' ? apartmentId ?? urlAptId : null
    const nextParams = buildCommunitySearchParams(scope, boardCode, sortType, nextAptId)
    if (nextParams.toString() !== searchParamKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    apartmentId,
    boardCode,
    scope,
    searchParamKey,
    setSearchParams,
    sortType,
    urlAptId,
    urlBoardCode,
    urlScope,
    urlSortType,
  ])

  useEffect(() => {
    if (prevAptIdRef.current === undefined) {
      prevAptIdRef.current = activeAptId
      return
    }
    if (prevAptIdRef.current !== activeAptId) {
      prevAptIdRef.current = activeAptId
      resetCommunityFilters()
      setIsBannerVisible(true)
    }
  }, [activeAptId, resetCommunityFilters])

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['community', 'posts', scope, activeAptId, boardCode, sortType],
    queryFn: () => fetchPosts(scope, activeAptId, boardCode, sortType),
    enabled: scope === 'GLOBAL' || activeAptId != null,
    staleTime: 1000 * 60 * 5,
  })

  const filteredPosts = searchKeyword
    ? posts.filter((p) => p.title.includes(searchKeyword) || p.content.includes(searchKeyword))
    : posts

  const renderBanner = () => {
    if (scope === 'APARTMENT' && activeAptId == null) {
      return <AptSelectPromptBanner />
    }
    if (status === 'GUEST' && isBannerVisible) {
      return <GuestBanner isVisible={isBannerVisible} onClose={() => setIsBannerVisible(false)} />
    }
    return null
  }

  const renderFeed = () => {
    if (scope === 'APARTMENT' && activeAptId == null) return null
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

  const aptId = activeAptId != null ? String(activeAptId) : ''

  const handleApartmentSelect = (nextAptId: number) => {
    pendingUserAptIdRef.current = nextAptId
    const nextParams = buildCommunitySearchParams('APARTMENT', boardCode, sortType, nextAptId)
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="flex flex-col pb-24">
      {renderBanner()}

      {scope === 'APARTMENT' && (
        <div className="px-4 pt-3">
          <MobileApartmentTrigger onClick={() => setIsModalOpen(true)} />
        </div>
      )}

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

      {(scope === 'GLOBAL' || activeAptId != null) && (
        <section className="space-y-3 px-4 pt-4 lg:hidden">
          {scope === 'APARTMENT' && <ApartmentInfoCard aptId={aptId} />}
          <TrendingKeywords scope={scope} aptId={aptId} boardCode={boardCode} />
          <PopularPosts scope={scope} aptId={aptId} boardCode={boardCode} />
          <MostCommentedPosts scope={scope} aptId={aptId} boardCode={boardCode} />
        </section>
      )}

      {isModalOpen && (
        <ApartmentSelectModal
          onClose={() => setIsModalOpen(false)}
          onSelectApartment={handleApartmentSelect}
        />
      )}
    </div>
  )
}
