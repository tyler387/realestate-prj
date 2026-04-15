import { useEffect, useState } from 'react'
import { CategoryFilter } from '../components/features/community/CategoryFilter'
import { SortDropdown } from '../components/features/community/SortDropdown'
import { PostList } from '../components/features/community/PostList'
import { GuestBanner } from '../components/common/GuestBanner'
import { MobileApartmentTrigger } from '../components/features/apartment-select/MobileApartmentTrigger'
import { ApartmentSelectModal } from '../components/features/apartment-select/ApartmentSelectModal'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

export const CommunityPage = () => {
  const status = useUserStore((s) => s.status)
  const setSearchKeyword = useUiStore((s) => s.setSearchKeyword)
  const [isBannerVisible, setIsBannerVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    return () => {
      setSearchKeyword(null)
    }
  }, [setSearchKeyword])

  return (
    <div className="flex flex-col pb-24">
      {status === 'GUEST' && <GuestBanner isVisible={isBannerVisible} onClose={() => setIsBannerVisible(false)} />}
      <div className="px-4 pt-3">
        <MobileApartmentTrigger onClick={() => setIsModalOpen(true)} />
      </div>
      <CategoryFilter />
      <SortDropdown />
      <PostList />

      {isModalOpen && (
        <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
