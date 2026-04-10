import { useEffect } from 'react'

type AuthBottomSheetProps = {
  isOpen: boolean
  userStatus: 'GUEST' | 'MEMBER'
  onClose: () => void
  onLogin: () => void
  onSignup: () => void
  onVerify: () => void
}

export const AuthBottomSheet = ({
  isOpen,
  userStatus,
  onClose,
  onLogin,
  onSignup,
  onVerify,
}: AuthBottomSheetProps) => {
  useEffect(() => {
    if (!isOpen) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />

      <section
        className="fixed bottom-0 left-1/2 z-[70] w-full max-w-3xl -translate-x-1/2 rounded-t-2xl bg-white px-6 pb-10 pt-4 shadow-2xl transition-transform duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        {userStatus === 'GUEST' ? (
          <>
            <h2 className="text-lg font-bold text-gray-900">로그인이 필요해요</h2>
            <p className="mb-6 mt-1 text-sm text-gray-500">회원만 글을 쓸 수 있어요</p>
            <button
              onClick={onLogin}
              className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
            >
              로그인하기
            </button>
            <button
              onClick={onSignup}
              className="mt-3 h-12 w-full rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              회원가입
            </button>
            <button onClick={onClose} className="mt-2 h-10 w-full text-sm text-gray-400">
              둘러보기
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900">거주지 인증이 필요해요</h2>
            <p className="mt-1 text-sm text-gray-500">내 아파트 주민만</p>
            <p className="mb-6 text-sm text-gray-500">글을 쓸 수 있어요</p>
            <button
              onClick={onVerify}
              className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
            >
              거주지 인증하기
            </button>
            <button onClick={onClose} className="mt-2 h-10 w-full text-sm text-gray-400">
              나중에 할게요
            </button>
          </>
        )}
      </section>
    </>
  )
}
