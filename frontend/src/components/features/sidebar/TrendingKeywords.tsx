import { useTrendingKeywords } from '../../../hooks/useSidebarData'
import { useUiStore } from '../../../stores/uiStore'
import { usePostStore } from '../../../stores/postStore'
import { SidebarCard, CardTitle } from './SidebarCard'
import { KeywordsSkeleton } from './SidebarSkeleton'
import { KeywordChip } from './KeywordChip'

export const TrendingKeywords = ({ aptId }: { aptId: string }) => {
  const { data, isLoading, isError } = useTrendingKeywords(aptId)
  const { searchKeyword, setSearchKeyword } = useUiStore()
  const { setCategory } = usePostStore()

  if (isError) return null

  const handleKeywordClick = (keyword: string) => {
    const next = searchKeyword === keyword ? null : keyword
    setSearchKeyword(next)
    if (next !== null) setCategory('전체')
  }

  return (
    <SidebarCard>
      <CardTitle>🔥 인기 키워드</CardTitle>
      {isLoading && <KeywordsSkeleton />}
      {data && (
        <div className="flex flex-wrap gap-2">
          {data.map((keyword: string) => (
            <KeywordChip
              key={keyword}
              keyword={keyword}
              isSelected={searchKeyword === keyword}
              onClick={() => handleKeywordClick(keyword)}
            />
          ))}
        </div>
      )}
    </SidebarCard>
  )
}
