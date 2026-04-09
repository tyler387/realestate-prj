import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category } from '../types'
import { useUserStore } from '../stores/userStore'

const categories: Exclude<Category, '전체'>[] = ['자유', '질문', '정보', '민원', '거래']

export const WritePage = () => {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const [category, setCategory] = useState<Exclude<Category, '전체'>>('자유')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return
    navigate('/')
  }

  return (
    <div className="flex flex-col pb-6">
      <div className="bg-blue-50 px-4 py-3 text-sm text-blue-600">
        {user?.complexName ?? '아파트'} 주민으로 글 작성 중
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === cat ? 'bg-blue-500 text-white' : 'border border-gray-200 text-gray-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4">
        <div className="relative mb-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 50))}
            placeholder="제목 입력"
            className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {title.length}/50
          </span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용 입력"
          rows={8}
          className="mb-4 w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
        />

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim()}
          className="w-full rounded-lg bg-blue-500 py-3 text-sm font-medium text-white disabled:opacity-40 hover:bg-blue-600"
        >
          등록하기
        </button>
      </div>
    </div>
  )
}
