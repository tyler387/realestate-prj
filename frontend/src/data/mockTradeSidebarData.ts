export type PriceTrendData = {
  period: '1w' | '1m'
  avgPrice: number
  changeRate: number
  transactionCount: number
}

export type HighestPriceDeal = {
  aptId: string
  aptName: string
  price: number
  dealDate: string
  area: number
  isNewHigh: boolean
}

export type TopTransactionApartment = {
  rank: number
  aptId: string
  aptName: string
  transactionCount: number
}

export const mockPriceTrend: Record<'1w' | '1m', PriceTrendData> = {
  '1w': { period: '1w', avgPrice: 235000, changeRate: 2.3,  transactionCount: 18 },
  '1m': { period: '1m', avgPrice: 228000, changeRate: -1.2, transactionCount: 72 },
}

export const mockHighestPriceDeals: HighestPriceDeal[] = [
  { aptId: 'apt-001', aptName: '잠실엘스',       price: 240000, dealDate: '2026-04-08', area: 84.9,  isNewHigh: true  },
  { aptId: 'apt-002', aptName: '헬리오시티',      price: 195000, dealDate: '2026-04-05', area: 59.9,  isNewHigh: true  },
  { aptId: 'apt-003', aptName: '래미안퍼스티지',  price: 415000, dealDate: '2026-04-03', area: 114.9, isNewHigh: false },
]

export const mockTopTransactionApartments: TopTransactionApartment[] = [
  { rank: 1, aptId: 'apt-002', aptName: '헬리오시티',         transactionCount: 18 },
  { rank: 2, aptId: 'apt-001', aptName: '잠실엘스',           transactionCount: 15 },
  { rank: 3, aptId: 'apt-003', aptName: '래미안퍼스티지',     transactionCount: 12 },
  { rank: 4, aptId: 'apt-004', aptName: '아크로리버파크',     transactionCount: 8  },
  { rank: 5, aptId: 'apt-005', aptName: '마포래미안푸르지오', transactionCount: 7  },
]
