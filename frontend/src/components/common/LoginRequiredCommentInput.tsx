type LoginRequiredCommentInputProps = {
  userStatus: 'GUEST' | 'MEMBER'
  onClick: () => void
}

export const LoginRequiredCommentInput = ({ userStatus, onClick }: LoginRequiredCommentInputProps) => {
  const text =
    userStatus === 'GUEST'
      ? '로그인 후 댓글을 작성할 수 있어요'
      : '거주지 인증 후 댓글을 작성할 수 있어요'

  return (
    <button
      onClick={onClick}
      className="fixed bottom-0 left-1/2 z-40 flex h-14 w-full max-w-3xl -translate-x-1/2 items-center justify-center border-t border-gray-200 bg-gray-50 text-sm text-gray-400"
    >
      {text}
    </button>
  )
}
