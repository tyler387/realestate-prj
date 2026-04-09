import { useNavigate } from 'react-router-dom'
import type { ApartmentMarker } from '../../../types'
import { useUserStore } from '../../../stores/userStore'
import { mockPosts } from '../../../data/mockData'
import { formatPrice } from '../../../utils/formatPrice'

export const ApartmentPanel = ({ apartment }: { apartment: ApartmentMarker | null }) => {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)

  const handleWrite = () => {
    if (user?.verified) navigate('/write')
    else navigate('/verify')
  }

  if (!apartment) {
    return (
      <div className="flex min-h-[160px] items-center justify-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-400">지도에서 마커를 클릭하세요</p>
      </div>
    )
  }

  const recentPosts = mockPosts.slice(0, 3)

  return (
    <div className="min-h-[200px] border-t border-gray-200 bg-white">
      <div className="mx-auto my-1.5 h-1 w-10 rounded-full bg-gray-200" />
      <div className="px-4 pb-4 pt-2">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">{apartment.complexName}</h3>
            <p className="text-xs text-gray-400">{apartment.eupMyeonDong}</p>
          </div>
          {apartment.latestSalePrice && (
            <span className="text-sm font-semibold text-blue-500">
              {formatPrice(apartment.latestSalePrice)}
            </span>
          )}
        </div>

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

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            더보기
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
