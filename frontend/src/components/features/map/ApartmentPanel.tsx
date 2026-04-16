import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApartmentMarker } from '../../../types'
import { formatPrice } from '../../../utils/formatPrice'
import { useUserStore } from '../../../stores/userStore'
import { useUiStore } from '../../../stores/uiStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

type RecentPost = { id: number; title: string }

export const ApartmentPanel = ({ apartment }: { apartment: ApartmentMarker | null }) => {
  const navigate = useNavigate()
  const status = useUserStore((s) => s.status)
  const openAuthSheet = useUiStore((s) => s.openAuthSheet)
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])

  useEffect(() => {
    if (!apartment) {
      setRecentPosts([])
      return
    }
    fetch(`${API_BASE_URL}/api/community/posts?aptId=${apartment.id}&sortType=최신순`)
      .then((r) => r.json())
      .then((data: RecentPost[]) => setRecentPosts(data.slice(0, 3)))
      .catch(() => setRecentPosts([]))
  }, [apartment?.id])

  const handleWrite = () => {
    if (status === 'VERIFIED') {
      navigate('/write')
      return
    }
    openAuthSheet()
  }

  if (!apartment) {
    return (
      <div className="z-10 flex min-h-[160px] items-center justify-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-400">지도에서 마커를 클릭해주세요</p>
      </div>
    )
  }

  return (
    <div className="z-10 min-h-[200px] border-t border-gray-200 bg-white">
      <div className="mx-auto my-1.5 h-1 w-10 rounded-full bg-gray-200" />
      <div className="px-4 pb-4 pt-2">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">{apartment.complexName}</h3>
            <p className="text-xs text-gray-400">{apartment.eupMyeonDong}</p>
          </div>
          {apartment.latestSalePrice && (
            <span className="text-sm font-semibold text-blue-500">{formatPrice(apartment.latestSalePrice)}</span>
          )}
        </div>

        {recentPosts.length > 0 && (
          <div className="my-3 space-y-1">
            {recentPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="block w-full truncate text-left text-xs text-gray-600 hover:text-blue-500"
              >
                · {post.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            둘러보기
          </button>
          <button
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
