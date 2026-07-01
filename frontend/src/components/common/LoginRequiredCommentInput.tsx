type LoginRequiredCommentInputProps = {
  userStatus: 'GUEST' | 'MEMBER'
  onClick: () => void
}

export const LoginRequiredCommentInput = ({ userStatus, onClick }: LoginRequiredCommentInputProps) => {
  const text =
    userStatus === 'GUEST'
      ? '로그인하고 참여하기'
      : '아파트 인증하고 참여하기'

  return (
    <button
      onClick={onClick}
      aria-label="댓글 작성 권한 안내 열기"
      className="fixed bottom-0 left-1/2 z-40 flex h-14 w-full max-w-3xl -translate-x-1/2 items-center justify-center border-t border-line-base bg-surface-base text-sm font-semibold text-text-muted shadow-[0_-4px_12px_rgba(15,23,42,0.04)]"
    >
      {text}
    </button>
  )
}
