import { useUserStore } from '../../../stores/userStore'

export const MobileApartmentTrigger = ({ onClick }: { onClick: () => void }) => {
  const apartmentName = useUserStore(s => s.apartmentName)

  return (
    <button
      onClick={onClick}
      className="lg:hidden w-full flex items-center gap-2
                 mx-0 mb-3
                 bg-white border border-gray-200 rounded-xl
                 px-4 py-2.5 text-left cursor-pointer
                 hover:border-blue-400 transition-colors"
    >
      <span className="text-gray-400 text-sm">🔍</span>
      <span className="text-sm text-gray-400 truncate">
        {apartmentName ?? '아파트명 또는 지역 검색'}
      </span>
    </button>
  )
}
