import type { BoardCode, CommunityScope, SortType } from '../types'

export const DEFAULT_COMMUNITY_SCOPE: CommunityScope = 'GLOBAL'
export const DEFAULT_GLOBAL_BOARD: BoardCode = 'BLAH'
export const DEFAULT_APARTMENT_BOARD: BoardCode = 'APT_ALL'
export const DEFAULT_SORT_TYPE: SortType = '최신순'

export const scopeTabs: Array<{ value: CommunityScope; label: string }> = [
  { value: 'GLOBAL', label: '전체 커뮤니티' },
  { value: 'APARTMENT', label: '우리 아파트' },
]

export const globalBoards: Array<{ value: BoardCode; label: string }> = [
  { value: 'BLAH', label: '블라블라' },
  { value: 'REAL_ESTATE', label: '부동산' },
  { value: 'STOCK', label: '주식' },
  { value: 'DATING', label: '연애' },
]

export const apartmentBoards: Array<{ value: BoardCode; label: string }> = [
  { value: 'APT_ALL', label: '전체' },
  { value: 'APT_FREE', label: '자유' },
  { value: 'APT_QNA', label: '질문' },
  { value: 'APT_INFO', label: '정보' },
  { value: 'APT_TRADE', label: '실거래' },
  { value: 'APT_ISSUE', label: '민원/하자' },
]

export const communitySortTypes: SortType[] = ['최신순', '인기순', '댓글순']

export const isCommunityScope = (value: string | null): value is CommunityScope =>
  value === 'GLOBAL' || value === 'APARTMENT'

export const isBoardCodeForScope = (scope: CommunityScope, value: string | null): value is BoardCode => {
  const boards = scope === 'GLOBAL' ? globalBoards : apartmentBoards
  return boards.some((board) => board.value === value)
}

export const isSortType = (value: string | null): value is SortType =>
  communitySortTypes.includes(value ?? '')

export const defaultBoardForScope = (scope: CommunityScope): BoardCode =>
  scope === 'GLOBAL' ? DEFAULT_GLOBAL_BOARD : DEFAULT_APARTMENT_BOARD

export const boardsForScope = (scope: CommunityScope) =>
  scope === 'GLOBAL' ? globalBoards : apartmentBoards

export const boardLabelOf = (boardCode: BoardCode) =>
  [...globalBoards, ...apartmentBoards].find((board) => board.value === boardCode)?.label ?? '자유'
