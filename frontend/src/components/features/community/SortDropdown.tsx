import { usePostStore } from '../../../stores/postStore'
import { communitySortTypes, sortTypeLabelOf } from '../../../constants/communityBoards'
import type { SortType } from '../../../types'

export const SortDropdown = () => {
  const { sortType, setSortType } = usePostStore()

  return (
    <div className="flex justify-end px-4 py-2">
      <select
        value={sortType}
        onChange={(event) => setSortType(event.target.value as SortType)}
        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
      >
        {communitySortTypes.map((sort) => (
          <option key={sort} value={sort}>
            {sortTypeLabelOf(sort)}
          </option>
        ))}
      </select>
    </div>
  )
}
