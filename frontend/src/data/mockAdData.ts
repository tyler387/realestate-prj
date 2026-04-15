import type { Ad } from '../types/ad'

export const USE_MOCK_AD = true

export const mockAds: Ad[] = [
  {
    adId:        'AD001',
    slot:        'RIGHT_SIDEBAR_MIDDLE',
    title:       '잠실 부동산 상담',
    description: '수수료 할인 이벤트 진행 중',
    imageUrl:    'https://placehold.co/220x120/EEF2FF/6366f1?text=AD',
    linkUrl:     'https://example.com/ad1',
    priority:    10,
    weight:      70,
  },
  {
    adId:        'AD002',
    slot:        'RIGHT_SIDEBAR_MIDDLE',
    title:       '송파 인테리어 전문점',
    description: '이사 후 인테리어 견적 받기',
    imageUrl:    'https://placehold.co/220x120/F0FDF4/22c55e?text=AD',
    linkUrl:     'https://example.com/ad2',
    priority:    8,
    weight:      30,
  },
  {
    adId:        'AD003',
    slot:        'RIGHT_SIDEBAR_BOTTOM',
    title:       '아파트 관리비 절약 팁',
    description: '에너지 절약 서비스 무료 신청',
    imageUrl:    'https://placehold.co/220x120/FFF7ED/f97316?text=AD',
    linkUrl:     'https://example.com/ad3',
    priority:    5,
    weight:      100,
  },
]

export const selectWeightedAd = (ads: Ad[]): Ad | null => {
  if (ads.length === 0) return null
  if (ads.length === 1) return ads[0]

  const total = ads.reduce((sum, ad) => sum + ad.weight, 0)
  let random  = Math.random() * total

  for (const ad of ads) {
    random -= ad.weight
    if (random <= 0) return ad
  }
  return ads[ads.length - 1]
}
