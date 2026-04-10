export type TradeRanking = {
  rank: number
  apartmentId: number
  apartmentName: string
  address: string
  tradeCount: number
  latestPrice: number
  priceChange: number
  priceChangeRate: number
}

export type Apartment = {
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
  deposit?: number
  monthlyRent?: number
  contractDate: string
}

export type PriceHistory = {
  month: string
  avgPrice: number
  tradeType: '매매' | '전세' | '월세'
}

export const mockTradeRankings: Record<'1d' | '1w' | '1m', TradeRanking[]> = {
  '1d': [
    { rank: 1, apartmentId: 1, apartmentName: '잠실엘스',        address: '서울 송파구', tradeCount: 3,  latestPrice: 235000, priceChange: 5000,  priceChangeRate: 2.2  },
    { rank: 2, apartmentId: 2, apartmentName: '헬리오시티',       address: '서울 송파구', tradeCount: 2,  latestPrice: 198000, priceChange: -3000, priceChangeRate: -1.5 },
    { rank: 3, apartmentId: 3, apartmentName: '래미안퍼스티지',   address: '서울 서초구', tradeCount: 2,  latestPrice: 410000, priceChange: 0,     priceChangeRate: 0    },
    { rank: 4, apartmentId: 4, apartmentName: '아크로리버파크',   address: '서울 서초구', tradeCount: 1,  latestPrice: 520000, priceChange: 10000, priceChangeRate: 1.9  },
    { rank: 5, apartmentId: 5, apartmentName: '마포래미안푸르지오', address: '서울 마포구', tradeCount: 1,  latestPrice: 135000, priceChange: -1000, priceChangeRate: -0.7 },
  ],
  '1w': [
    { rank: 1, apartmentId: 2, apartmentName: '헬리오시티',       address: '서울 송파구', tradeCount: 18, latestPrice: 198000, priceChange: -3000, priceChangeRate: -1.5 },
    { rank: 2, apartmentId: 1, apartmentName: '잠실엘스',         address: '서울 송파구', tradeCount: 15, latestPrice: 235000, priceChange: 5000,  priceChangeRate: 2.2  },
    { rank: 3, apartmentId: 5, apartmentName: '마포래미안푸르지오', address: '서울 마포구', tradeCount: 12, latestPrice: 135000, priceChange: -1000, priceChangeRate: -0.7 },
    { rank: 4, apartmentId: 3, apartmentName: '래미안퍼스티지',   address: '서울 서초구', tradeCount: 10, latestPrice: 410000, priceChange: 0,     priceChangeRate: 0    },
    { rank: 5, apartmentId: 4, apartmentName: '아크로리버파크',   address: '서울 서초구', tradeCount: 8,  latestPrice: 520000, priceChange: 10000, priceChangeRate: 1.9  },
  ],
  '1m': [
    { rank: 1, apartmentId: 2, apartmentName: '헬리오시티',       address: '서울 송파구', tradeCount: 52, latestPrice: 198000, priceChange: -3000, priceChangeRate: -1.5 },
    { rank: 2, apartmentId: 1, apartmentName: '잠실엘스',         address: '서울 송파구', tradeCount: 48, latestPrice: 235000, priceChange: 5000,  priceChangeRate: 2.2  },
    { rank: 3, apartmentId: 5, apartmentName: '마포래미안푸르지오', address: '서울 마포구', tradeCount: 39, latestPrice: 135000, priceChange: -1000, priceChangeRate: -0.7 },
    { rank: 4, apartmentId: 3, apartmentName: '래미안퍼스티지',   address: '서울 서초구', tradeCount: 31, latestPrice: 410000, priceChange: 0,     priceChangeRate: 0    },
    { rank: 5, apartmentId: 4, apartmentName: '아크로리버파크',   address: '서울 서초구', tradeCount: 24, latestPrice: 520000, priceChange: 10000, priceChangeRate: 1.9  },
  ],
}

export const mockApartments: Apartment[] = [
  { apartmentId: 1, apartmentName: '잠실엘스',         address: '서울 송파구 잠실동',      latestPrice: 235000 },
  { apartmentId: 2, apartmentName: '헬리오시티',        address: '서울 송파구 가락동',      latestPrice: 198000 },
  { apartmentId: 3, apartmentName: '래미안퍼스티지',    address: '서울 서초구 반포동',      latestPrice: 410000 },
  { apartmentId: 4, apartmentName: '아크로리버파크',    address: '서울 서초구 반포동',      latestPrice: 520000 },
  { apartmentId: 5, apartmentName: '마포래미안푸르지오', address: '서울 마포구 아현동',      latestPrice: 135000 },
]

export const mockTradeRecords: TradeRecord[] = [
  { id: 1, apartmentId: 1, buildingName: '101동', floor: '15층', area: 84.9,  tradeType: '매매', price: 235000,                              contractDate: '2025.03.28' },
  { id: 2, apartmentId: 1, buildingName: '102동', floor: '8층',  area: 84.9,  tradeType: '매매', price: 231000,                              contractDate: '2025.03.15' },
  { id: 3, apartmentId: 1, buildingName: '103동', floor: '22층', area: 114.9, tradeType: '매매', price: 310000,                              contractDate: '2025.03.10' },
  { id: 4, apartmentId: 1, buildingName: '101동', floor: '7층',  area: 59.9,  tradeType: '전세', price: 80000,                               contractDate: '2025.03.25' },
  { id: 5, apartmentId: 1, buildingName: '104동', floor: '12층', area: 84.9,  tradeType: '전세', price: 110000,                              contractDate: '2025.03.18' },
  { id: 6, apartmentId: 1, buildingName: '102동', floor: '3층',  area: 59.9,  tradeType: '월세', price: 0, deposit: 50000, monthlyRent: 120,  contractDate: '2025.03.20' },
]

export const mockPriceHistory: PriceHistory[] = [
  { month: '24.04', avgPrice: 218000, tradeType: '매매' },
  { month: '24.05', avgPrice: 221000, tradeType: '매매' },
  { month: '24.06', avgPrice: 219000, tradeType: '매매' },
  { month: '24.07', avgPrice: 225000, tradeType: '매매' },
  { month: '24.08', avgPrice: 228000, tradeType: '매매' },
  { month: '24.09', avgPrice: 224000, tradeType: '매매' },
  { month: '24.10', avgPrice: 229000, tradeType: '매매' },
  { month: '24.11', avgPrice: 231000, tradeType: '매매' },
  { month: '24.12', avgPrice: 230000, tradeType: '매매' },
  { month: '25.01', avgPrice: 233000, tradeType: '매매' },
  { month: '25.02', avgPrice: 232000, tradeType: '매매' },
  { month: '25.03', avgPrice: 235000, tradeType: '매매' },
  { month: '24.04', avgPrice: 76000,  tradeType: '전세' },
  { month: '24.05', avgPrice: 77000,  tradeType: '전세' },
  { month: '24.06', avgPrice: 76500,  tradeType: '전세' },
  { month: '24.07', avgPrice: 78000,  tradeType: '전세' },
  { month: '24.08', avgPrice: 79000,  tradeType: '전세' },
  { month: '24.09', avgPrice: 78500,  tradeType: '전세' },
  { month: '24.10', avgPrice: 79500,  tradeType: '전세' },
  { month: '24.11', avgPrice: 80000,  tradeType: '전세' },
  { month: '24.12', avgPrice: 80000,  tradeType: '전세' },
  { month: '25.01', avgPrice: 81000,  tradeType: '전세' },
  { month: '25.02', avgPrice: 80500,  tradeType: '전세' },
  { month: '25.03', avgPrice: 82000,  tradeType: '전세' },
]
