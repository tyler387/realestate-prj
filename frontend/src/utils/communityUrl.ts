import type { BoardCode, CommunityScope, SortType } from '../types'

export const buildCommunitySearchParams = (
  scope: CommunityScope,
  boardCode: BoardCode,
  sortType: SortType,
  aptId: number | null,
) => {
  const params = new URLSearchParams({
    scope,
    boardCode,
    sortType,
  })
  if (scope === 'APARTMENT' && aptId != null) params.set('aptId', String(aptId))
  return params
}
