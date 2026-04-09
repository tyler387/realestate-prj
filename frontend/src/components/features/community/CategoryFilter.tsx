import type { Category } from '../../../types'
import { usePostStore } from '../../../stores/postStore'

const categories: Category[] = ['전체', '자유', '질문', '정보', '민원', '거래']

export const CategoryFilter = () => {
  const { selectedCategory, setCategory } = usePostStore()

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            selectedCategory === cat
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-500 border border-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
