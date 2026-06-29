export type DealType = 'SALE' | 'JEONSE' | 'MONTHLY' | null
export type SupportedDealType = 'SALE' | 'JEONSE' | null
export type TradeTypeLabel = '매매' | '전세' | '월세'

export const UNSUPPORTED_RENT_NOTICE = '월세 데이터는 아직 차트 기준이 정리되지 않아 매매 기준으로 조회합니다.'
export const RENT_READY_NOTICE = '전세 실거래는 제공 중이며, 월세 데이터는 준비 중입니다.'

export const isUnsupportedRentDealType = (dealType: DealType): dealType is 'MONTHLY' =>
  dealType === 'MONTHLY'

export const normalizeSupportedDealType = (dealType: DealType): SupportedDealType => {
  if (isUnsupportedRentDealType(dealType)) return 'SALE'
  return dealType
}

export const toTradeTypeLabel = (tradeType: string): TradeTypeLabel => {
  if (tradeType === 'LEASE' || tradeType === 'JEONSE' || tradeType === '전세') return '전세'
  if (tradeType === 'MONTHLY' || tradeType === '월세') return '월세'
  return '매매'
}
