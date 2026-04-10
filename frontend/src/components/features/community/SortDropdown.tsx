import type { SortType } from '../../../types'
import { usePostStore } from '../../../stores/postStore'

const sorts: SortType[] = ['최신순', '인기순']

export const SortDropdown = () => {
  const { sortType, setSortType } = usePostStore()

  return (
    <div className="flex justify-end px-4 py-2">
      <select
        value={sortType}
        onChange={(event) => setSortType(event.target.value)}
        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
      >
        {sorts.map((sort) => (
          <option key={sort} value={sort}>
            {sort}
          </option>
        ))}
      </select>
    </div>
  )
}
