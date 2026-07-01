type Props = {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string    // 확인 버튼 텍스트 (기본: "삭제")
  confirmDisabled?: boolean // 처리 중일 때 확인 버튼 비활성화 (기본: false)
}

export const ConfirmDialog = ({
  message,
  onConfirm,
  onCancel,
  confirmLabel = '삭제',
  confirmDisabled = false,
}: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-6">
    <div className="w-full max-w-sm rounded-xl border border-line-base bg-surface-base px-6 py-5 shadow-floating">
      <p className="mb-5 text-center text-sm leading-6 text-text-body">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-line-base bg-surface-base py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-soft"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-colors ${
            confirmDisabled
              ? 'cursor-not-allowed bg-red-300'
              : 'bg-market-sale hover:bg-red-600'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
)
