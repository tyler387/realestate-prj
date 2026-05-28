import { useEffect } from 'react'
import type { AuthSheetAction } from '../../stores/uiStore'

type AuthBottomSheetProps = {
  isOpen: boolean
  userStatus: 'GUEST' | 'MEMBER'
  action?: AuthSheetAction
  onClose: () => void
  onLogin: () => void
  onSignup: () => void
  onVerify: () => void
}

const actionLabels: Record<AuthSheetAction, string> = {
  write: '글쓰기',
  comment: '댓글 작성',
  like: '좋아요',
  favorite: '관심 단지 등록',
}

export const AuthBottomSheet = ({
  isOpen,
  userStatus,
  action = 'write',
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

  const actionLabel = actionLabels[action]
  const guestDescription =
    action === 'favorite'
      ? `${actionLabel}은 로그인 후 이용할 수 있어요`
      : `${actionLabel}은 로그인 후 참여할 수 있어요`
  const memberDescription = `${actionLabel}은 아파트 인증 후 참여할 수 있어요`

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
            <p className="mb-6 mt-1 text-sm text-gray-500">{guestDescription}</p>
            <button
              onClick={onLogin}
              className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
            >
              로그인하고 참여하기
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
            <h2 className="text-lg font-bold text-gray-900">아파트 인증이 필요해요</h2>
            <p className="mb-6 mt-1 text-sm text-gray-500">{memberDescription}</p>
            <button
              onClick={onVerify}
              className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
            >
              아파트 인증하고 참여하기
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
