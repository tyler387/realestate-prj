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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="mx-6 w-full max-w-sm rounded-2xl bg-white px-6 py-5 shadow-xl">
      <p className="mb-5 text-center text-sm text-gray-700">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-500 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`flex-1 rounded-xl py-3 text-sm font-medium text-white ${
            confirmDisabled
              ? 'cursor-not-allowed bg-red-300'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
)
