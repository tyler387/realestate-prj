export type TradeApartment = {
  apartmentId: number
  apartmentName: string
  address: string
  latestPrice: number
}

export type TradeRecord = {
  id: number
  apartmentId: number
  buildingName?: string
  floor: string
  area: number
  tradeType: '매매' | '전세' | '월세'
  price: number
  pricePerPyeong?: number | null
  deposit?: number
  monthlyRent?: number
  contractDate: string
}

export type PriceHistory = {
  month: string
  avgPrice: number
  avgPricePerPyeong: number | null
  transactionCount: number
  tradeType: '매매' | '전세' | '월세'
}

export type TradeAreaOption = {
  area: number
  transactionCount: number
}

export type TopApartment = {
  rank: number
  aptId: number
  aptName: string
  sigungu: string
  transactionCount: number
  recentMonthAvgPrice: number | null
}
