import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApartmentMarker } from '../../../types'
import { formatPrice } from '../../../utils/formatPrice'
import { useUserStore } from '../../../stores/userStore'
import { useUiStore } from '../../../stores/uiStore'
import { usePostStore } from '../../../stores/postStore'
import { buildCommunitySearchParams } from '../../../utils/communityUrl'
import { DEFAULT_APARTMENT_BOARD, DEFAULT_SORT_TYPE } from '../../../constants/communityBoards'
import { fetchPosts } from '../../../services/communityService'

type RecentPost = { id: number; title: string }

const toTradeTypeLabel = (tradeType?: string | null): string => {
  if (tradeType === 'LEASE' || tradeType === 'JEONSE') return '전세'
  if (tradeType === 'MONTHLY') return '월세'
  return '매매'
}

export const ApartmentPanel = ({ apartment }: { apartment: ApartmentMarker | null }) => {
  const navigate = useNavigate()
  const status = useUserStore((state) => state.status)
  const setUser = useUserStore((state) => state.setUser)
  const setCommunityState = usePostStore((state) => state.setCommunityState)
  const openAuthSheet = useUiStore((state) => state.openAuthSheet)
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])

  useEffect(() => {
    if (!apartment) {
      setRecentPosts([])
      return
    }

    fetchPosts('APARTMENT', apartment.id, DEFAULT_APARTMENT_BOARD, DEFAULT_SORT_TYPE)
      .then((posts) => setRecentPosts(posts.slice(0, 3)))
      .catch(() => setRecentPosts([]))
  }, [apartment])

  const handleWrite = () => {
    if (status === 'VERIFIED') {
      if (apartment) {
        setUser({
          apartmentId: apartment.id,
          apartmentName: apartment.complexName,
        })
        setCommunityState({
          scope: 'APARTMENT',
          boardCode: DEFAULT_APARTMENT_BOARD,
          sortType: DEFAULT_SORT_TYPE,
        })
      }
      navigate('/write')
      return
    }
    openAuthSheet('write')
  }

  const handleBrowse = () => {
    if (!apartment) return
    setUser({
      apartmentId: apartment.id,
      apartmentName: apartment.complexName,
    })
    const params = buildCommunitySearchParams('APARTMENT', DEFAULT_APARTMENT_BOARD, DEFAULT_SORT_TYPE, apartment.id)
    navigate(`/?${params.toString()}`)
  }

  if (!apartment) {
    return (
      <div className="z-10 flex min-h-[160px] items-center justify-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-400">지도에서 마커를 선택해주세요</p>
      </div>
    )
  }

  return (
    <div className="z-10 min-h-[200px] border-t border-gray-200 bg-white">
      <div className="mx-auto my-1.5 h-1 w-10 rounded-full bg-gray-200" />
      <div className="px-4 pb-4 pt-2">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900">{apartment.complexName}</h3>
            <p className="text-xs text-gray-400">{apartment.eupMyeonDong}</p>
          </div>
          {apartment.latestSalePrice && (
            <div className="shrink-0 text-right">
              <span className="block text-[11px] font-bold text-gray-400">
                최근 {toTradeTypeLabel(apartment.latestTradeType)}
              </span>
              <span className="block text-sm font-semibold text-blue-500">
                {formatPrice(apartment.latestSalePrice)}
              </span>
            </div>
          )}
        </div>

        {recentPosts.length > 0 && (
          <div className="my-3 space-y-1">
            {recentPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => navigate(`/post/${post.id}`)}
                className="block w-full truncate text-left text-xs text-gray-600 hover:text-blue-500"
              >
                {post.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBrowse}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            둘러보기
          </button>
          <button
            type="button"
            onClick={handleWrite}
            className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            글쓰기
          </button>
        </div>
      </div>
    </div>
  )
}
