import { useTrendingKeywords } from '../../../hooks/useSidebarData'
import { useUiStore } from '../../../stores/uiStore'
import { usePostStore } from '../../../stores/postStore'
import { SidebarCard } from './SidebarCard'
import { ErrorMessage, KeywordsSkeleton, SidebarEmptyState } from './SidebarSkeleton'
import { KeywordChip } from './KeywordChip'
import type { BoardCode, CommunityScope } from '../../../types'

type Props = {
  scope: CommunityScope
  aptId: string
  boardCode: BoardCode
}

export const TrendingKeywords = ({ scope, aptId, boardCode }: Props) => {
  const { data, isLoading, isError } = useTrendingKeywords(scope, aptId, boardCode)
  const { searchKeyword, setSearchKeyword } = useUiStore()
  const { setCategory } = usePostStore()

  const keywords = data ?? []
  const topKeywords = keywords.slice(0, 3)
  const normalKeywords = keywords.slice(3, 10)

  const handleKeywordClick = (keyword: string) => {
    const next = searchKeyword === keyword ? null : keyword
    setSearchKeyword(next)
    if (next !== null) setCategory('전체')
  }

  return (
    <SidebarCard className="p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">인기 키워드</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
          최근 7일
        </span>
      </div>

      {isLoading && <KeywordsSkeleton />}
      {isError && <ErrorMessage text="키워드를 불러올 수 없습니다" />}

      {!isLoading && !isError && keywords.length === 0 && (
        <SidebarEmptyState text="아직 집계된 키워드가 없습니다" />
      )}

      {!isError && !!topKeywords.length && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {topKeywords.map((keyword, idx) => (
            <KeywordChip
              key={keyword}
              keyword={keyword}
              rank={idx + 1}
              emphasis="top"
              isSelected={searchKeyword === keyword}
              onClick={() => handleKeywordClick(keyword)}
            />
          ))}
        </div>
      )}

      {!isError && !!normalKeywords.length && (
        <div className="flex flex-wrap gap-2">
          {normalKeywords.map((keyword, idx) => (
            <KeywordChip
              key={keyword}
              keyword={keyword}
              rank={idx + 4}
              emphasis="normal"
              isSelected={searchKeyword === keyword}
              onClick={() => handleKeywordClick(keyword)}
            />
          ))}
        </div>
      )}
    </SidebarCard>
  )
}
