import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePostStore } from '../stores/postStore'
import { useUserStore } from '../stores/userStore'
import { createPost } from '../services/communityService'
import { apartmentBoards, boardLabelOf, boardsForScope } from '../constants/communityBoards'
import { invalidateAfterPostCreate } from '../utils/communityQueryKeys'

export const WritePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { scope, boardCode, setBoardCode } = usePostStore()
  const apartmentId = useUserStore((s) => s.apartmentId)
  const apartmentName = useUserStore((s) => s.apartmentName)
  const verifiedApartmentName = useUserStore((s) => s.verifiedApartmentName)
  const status = useUserStore((s) => s.status)

  const boards = scope === 'GLOBAL'
    ? boardsForScope(scope)
    : apartmentBoards.filter((board) => board.value !== 'APT_ALL')
  const activeBoardCode = boards.some((board) => board.value === boardCode) ? boardCode : boards[0].value

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const writeContextText = scope === 'GLOBAL'
    ? status === 'VERIFIED'
      ? `${verifiedApartmentName ?? apartmentName ?? '아파트'} 인증 계정으로 전체 커뮤니티에 글 작성 중`
      : '전체 커뮤니티에 글 작성 중'
    : `${apartmentName ?? '아파트'} 게시판에 글 작성 중`

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || isSubmitting) return
    if (scope === 'APARTMENT' && apartmentId == null) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await createPost({
        scope,
        boardCode: activeBoardCode,
        aptId: scope === 'APARTMENT' ? apartmentId : null,
        category: boardLabelOf(activeBoardCode),
        title: title.trim(),
        content: content.trim(),
      })
      await invalidateAfterPostCreate(queryClient)
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : '게시글 등록에 실패했습니다.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col pb-6">
      <div className="bg-blue-50 px-4 py-3 text-sm text-blue-600">
        {writeContextText}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {boards.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setBoardCode(item.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeBoardCode === item.value ? 'bg-blue-500 text-white' : 'border border-gray-200 text-gray-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        <div className="relative mb-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 50))}
            placeholder="제목 입력"
            className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{title.length}/50</span>
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="내용 입력"
          rows={8}
          className="mb-4 w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
        />

        {submitError && <p className="mb-3 text-sm text-red-500">{submitError}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim() || (scope === 'APARTMENT' && apartmentId == null) || isSubmitting}
          className="w-full rounded-lg bg-blue-500 py-3 text-sm font-medium text-white disabled:opacity-40 hover:bg-blue-600"
        >
          {isSubmitting ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  )
}
