import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApartmentSelectModal } from '../apartment-select/ApartmentSelectModal'
import { usePostStore } from '../../../stores/postStore'
import { DEFAULT_APARTMENT_BOARD, isBoardCodeForScope } from '../../../constants/communityBoards'
import { buildCommunitySearchParams } from '../../../utils/communityUrl'

export const AptSelectPromptBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [, setSearchParams] = useSearchParams()
  const { boardCode, sortType, setCommunityState } = usePostStore()

  const handleSelectApartment = (apartmentId: number) => {
    const nextBoardCode = isBoardCodeForScope('APARTMENT', boardCode) ? boardCode : DEFAULT_APARTMENT_BOARD
    setCommunityState({ scope: 'APARTMENT', boardCode: nextBoardCode, sortType })
    setSearchParams(buildCommunitySearchParams('APARTMENT', nextBoardCode, sortType, apartmentId), { replace: true })
  }

  return (
    <>
      <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
        <span className="text-sm font-medium text-brand-700">
          아파트를 선택하면 해당 커뮤니티를 볼 수 있어요
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-3 flex-shrink-0 text-xs font-bold text-brand-700 transition-colors hover:text-brand-900"
        >
          선택하기
        </button>
      </div>

      {isModalOpen && (
        <ApartmentSelectModal
          onClose={() => setIsModalOpen(false)}
          onSelectApartment={handleSelectApartment}
        />
      )}
    </>
  )
}
