import type { Category } from '../../../types'
import { usePostStore } from '../../../stores/postStore'
import { useUiStore } from '../../../stores/uiStore'

const categories: Category[] = ['전체', '자유', '질문', '정보', '민원', '거래']

export const CategoryFilter = () => {
  const { selectedCategory, setCategory } = usePostStore()
  const setSearchKeyword = useUiStore((s) => s.setSearchKeyword)

  const handleCategoryChange = (category: Category) => {
    setCategory(category)
    setSearchKeyword(null)
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => handleCategoryChange(category)}
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            selectedCategory === category
              ? 'bg-blue-500 text-white'
              : 'border border-gray-200 bg-white text-gray-500'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
