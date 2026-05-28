import { boardLabelOf } from '../constants/communityBoards'
import type { BoardCode, CommunityScope } from '../types'

export const scopeLabelOf = (scope?: CommunityScope | null) =>
  scope === 'APARTMENT' ? '우리 아파트' : '전체 커뮤니티'

export const communityLocationLabel = (
  scope?: CommunityScope | null,
  boardCode?: BoardCode | null,
  fallbackCategory?: string | null,
) => {
  const boardLabel = boardCode ? boardLabelOf(boardCode) : fallbackCategory ?? '게시판'
  return `${scopeLabelOf(scope)} · ${boardLabel}`
}
