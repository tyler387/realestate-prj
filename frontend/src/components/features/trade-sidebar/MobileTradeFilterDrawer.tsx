import { useEffect } from 'react'
import { PriceTrendSummary } from './PriceTrendSummary'
import { QuickFilters } from './QuickFilters'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const MobileTradeFilterDrawer = ({ isOpen, onClose }: Props) => {
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="실거래 필터"
        className="fixed bottom-0 left-1/2 z-[61] flex max-h-[86vh] w-full max-w-3xl -translate-x-1/2 flex-col rounded-t-2xl bg-gray-50 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">실거래 필터</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="필터 닫기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modern-scroll flex-1 overflow-y-auto px-4 py-4">
          <PriceTrendSummary />
          <QuickFilters />
        </div>
      </section>
    </div>
  )
}
