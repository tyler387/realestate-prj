import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Apartment } from '../../../types'
import { useUserStore } from '../../../stores/userStore'
import { useUiStore } from '../../../stores/uiStore'
import { saveRecentApartment } from '../../../utils/recentApartments'
import { SearchSection } from './SearchSection'
import { MapSection } from './MapSection'

// ── aptId 변환 유틸 ────────────────────────────────────────────────
const toApartmentId = (aptId: string): number => {
  const parsed = Number(aptId.replace(/[^0-9]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

// ── ModalHeader ────────────────────────────────────────────────────
const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors"
      aria-label="닫기"
    >
      ✕
    </button>
  </div>
)

// ── TabSwitcher ────────────────────────────────────────────────────
type Tab = '검색' | '지도'

const TabSwitcher = ({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Tab[]
  activeTab: Tab
  onChange: (tab: Tab) => void
}) => (
  <div className="flex border-b border-gray-200 flex-shrink-0">
    {tabs.map(tab => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`flex-1 py-3 text-sm font-medium transition-colors
          ${activeTab === tab
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
          }`}
      >
        {tab}
      </button>
    ))}
  </div>
)

// ── ModalContent ───────────────────────────────────────────────────
const ModalContent = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<Tab>('검색')
  const showToast = useUiStore(s => s.showToast)

  const handleSelect = (apt: Apartment) => {
    useUserStore.getState().setUser({
      apartmentId:   toApartmentId(apt.aptId),
      apartmentName: apt.aptName,
    })
    saveRecentApartment(apt)
    onClose()
    showToast(`${apt.aptName} 커뮤니티로 이동했어요`, 'success')
  }

  return (
    <div className="flex flex-col h-full">
      <ModalHeader title="아파트 선택" onClose={onClose} />
      <TabSwitcher
        tabs={['검색', '지도']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <div className="flex-1 overflow-hidden">
        {activeTab === '검색' && <SearchSection onSelect={handleSelect} />}
        {activeTab === '지도'  && <MapSection    onSelect={handleSelect} />}
      </div>
    </div>
  )
}

// ── ApartmentSelectModal (Portal) ──────────────────────────────────
export const ApartmentSelectModal = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <>
      {/* Dim */}
      <div
        className="fixed inset-0 bg-black/50 z-[90]"
        onClick={onClose}
      />
      {/* Modal 본체 */}
      <div className="fixed inset-0 flex items-center justify-center z-[90] p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl
                     w-full h-[90vh] lg:h-[80vh] lg:max-w-[720px]
                     flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <ModalContent onClose={onClose} />
        </div>
      </div>
    </>,
    document.body
  )
}
