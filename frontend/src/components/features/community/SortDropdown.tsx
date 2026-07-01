import { usePostStore } from '../../../stores/postStore'
import { communitySortTypes, sortTypeLabelOf } from '../../../constants/communityBoards'
import type { SortType } from '../../../types'

export const SortDropdown = () => {
  const { sortType, setSortType } = usePostStore()

  return (
    <div className="flex justify-end px-4 pb-3 pt-1">
      <select
        value={sortType}
        onChange={(event) => setSortType(event.target.value as SortType)}
        className="rounded-lg border border-line-base bg-surface-base px-3 py-1.5 text-xs font-semibold text-text-muted outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
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
