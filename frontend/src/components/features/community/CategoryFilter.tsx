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
    <div className="bg-gray-50">
      <div className="grid grid-cols-2 gap-1 px-4 pt-3">
        {scopeTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleScopeChange(tab.value)}
            className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
              scope === tab.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'
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
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              boardCode === board.value
                ? 'bg-blue-500 text-white'
                : 'border border-gray-200 bg-white text-gray-500'
            }`}
          >
            {board.label}
          </button>
        ))}
      </div>
    </div>
  )
}
