import { useState } from 'react'
import { ApartmentSelectModal } from '../apartment-select/ApartmentSelectModal'

export const AptSelectPromptBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="mx-4 mb-3 px-4 py-3
                      bg-blue-50 border border-blue-100 rounded-xl
                      flex items-center justify-between">
        <span className="text-sm text-blue-700">
          🏢 아파트를 선택하면 해당 커뮤니티를 볼 수 있어요
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-blue-500 ml-3 flex-shrink-0
                     hover:text-blue-700 transition-colors"
        >
          선택하기
        </button>
      </div>

      {isModalOpen && (
        <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
