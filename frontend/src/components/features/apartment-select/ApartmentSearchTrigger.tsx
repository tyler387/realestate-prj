import { useState } from 'react'
import { useUserStore } from '../../../stores/userStore'
import { ApartmentSelectModal } from './ApartmentSelectModal'

export const ApartmentSearchTrigger = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const apartmentName = useUserStore(s => s.apartmentName)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center gap-2 mb-4
                   bg-white border border-gray-200 rounded-xl
                   px-4 py-3 text-left cursor-pointer
                   hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <span className="text-gray-400 text-sm flex-shrink-0">🔍</span>
        <span className="text-sm text-gray-600 truncate">
          {apartmentName ?? '아파트명 또는 지역 검색'}
        </span>
      </button>

      {isModalOpen && (
        <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
