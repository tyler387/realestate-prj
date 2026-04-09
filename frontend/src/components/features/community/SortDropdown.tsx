import type { SortType } from '../../../types'
import { usePostStore } from '../../../stores/postStore'

const sorts: SortType[] = ['최신순', '인기순']

export const SortDropdown = () => {
  const { sortType, setSortType } = usePostStore()

  return (
    <div className="flex justify-end px-4 py-2">
      <select
        value={sortType}
        onChange={(e) => setSortType(e.target.value as SortType)}
        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
      >
        {sorts.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}
