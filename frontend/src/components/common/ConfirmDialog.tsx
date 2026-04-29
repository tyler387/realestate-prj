type Props = {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({ message, onConfirm, onCancel }: Props) => (
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
          className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)
