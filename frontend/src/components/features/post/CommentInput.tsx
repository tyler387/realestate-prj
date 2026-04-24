import { useState } from 'react'

type Props = {
  onSubmit: (content: string) => void
}

export const CommentInput = ({ onSubmit }: Props) => {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-40 flex h-14 w-full max-w-3xl -translate-x-1/2 items-center gap-2 border-t border-gray-200 bg-white px-4">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="댓글을 입력하세요"
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
