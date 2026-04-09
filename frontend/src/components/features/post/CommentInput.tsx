import { useState } from 'react'

export const CommentInput = () => {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim()) return
    setValue('')
  }

  return (
    <div className="sticky bottom-0 z-40 flex h-14 w-full items-center gap-2 border-t border-gray-200 bg-white px-4">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="댓글 입력..."
        className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-blue-500"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        전송
      </button>
    </div>
  )
}
