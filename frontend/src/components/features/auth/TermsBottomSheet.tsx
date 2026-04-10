import { mockTerms } from '../../../data/mockAuthData'

type TermsKey = keyof typeof mockTerms

type TermsBottomSheetProps = {
  isOpen: boolean
  termKey: TermsKey | null
  onClose: () => void
}

const titles: Record<TermsKey, string> = {
  service: '서비스 이용약관',
  privacy: '개인정보 처리방침',
  marketing: '마케팅 정보 수신 동의',
}

export const TermsBottomSheet = ({ isOpen, termKey, onClose }: TermsBottomSheetProps) => {
  if (!isOpen || !termKey) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} aria-hidden />
      <section className="fixed bottom-0 left-1/2 z-[80] flex h-[80vh] w-full max-w-3xl -translate-x-1/2 flex-col rounded-t-2xl bg-white">
        <div className="flex items-center justify-between border-b px-4 py-4">
          <h3 className="text-base font-bold">{titles[termKey]}</h3>
          <button onClick={onClose} className="text-gray-400" aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
          {mockTerms[termKey]}
        </div>
        <div className="border-t px-4 py-3">
          <button onClick={onClose} className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white">
            확인
          </button>
        </div>
      </section>
    </>
  )
}
