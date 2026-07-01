import type { BoardCode, CommunityScope } from '../../../types'
import { usePostStore } from '../../../stores/postStore'
import { useUiStore } from '../../../stores/uiStore'
import { boardsForScope, scopeTabs } from '../../../constants/communityBoards'

export const CategoryFilter = () => {
  const { scope, boardCode, setScope, setBoardCode } = usePostStore()
  const setSearchKeyword = useUiStore((s) => s.setSearchKeyword)
  const boards = boardsForScope(scope)

  const handleScopeChange = (nextScope: CommunityScope) => {
    setScope(nextScope)
    setSearchKeyword(null)
  }

  const handleBoardChange = (nextBoardCode: BoardCode) => {
    setBoardCode(nextBoardCode)
    setSearchKeyword(null)
  }

  return (
    <div className="bg-surface-app">
      <div className="grid grid-cols-2 gap-1 px-4 pt-3">
        {scopeTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleScopeChange(tab.value)}
            className={`h-9 rounded-lg border text-sm font-semibold transition-colors ${
              scope === tab.value
                ? 'border-brand-600 bg-brand-600 text-white shadow-panel'
                : 'border-line-base bg-surface-base text-text-muted hover:bg-surface-soft'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {boards.map((board) => (
          <button
            key={board.value}
            type="button"
            onClick={() => handleBoardChange(board.value)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
              boardCode === board.value
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-line-base bg-surface-base text-text-muted hover:bg-surface-soft'
            }`}
          >
            {board.label}
          </button>
        ))}
      </div>
    </div>
  )
}
