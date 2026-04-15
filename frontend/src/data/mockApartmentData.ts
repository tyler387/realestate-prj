import type { Apartment } from '../types'

export const mockSearchResults: Apartment[] = [
  { aptId: 'APT001', aptName: '잠실엘스',         address: '서울 송파구 잠실동', lat: 37.511, lng: 127.087 },
  { aptId: 'APT002', aptName: '잠실 리센츠',       address: '서울 송파구 잠실동', lat: 37.512, lng: 127.088 },
  { aptId: 'APT003', aptName: '잠실 트리지움',     address: '서울 송파구 잠실동', lat: 37.513, lng: 127.089 },
  { aptId: 'APT004', aptName: '잠실 파크리오',     address: '서울 송파구 신천동', lat: 37.514, lng: 127.090 },
  { aptId: 'APT005', aptName: '잠실 레이크팰리스', address: '서울 송파구 잠실동', lat: 37.515, lng: 127.091 },
]

export const mockPopularApartments: Apartment[] = [
  { aptId: 'APT001', aptName: '잠실엘스',           address: '서울 송파구 잠실동', lat: 37.511, lng: 127.087 },
  { aptId: 'APT006', aptName: '헬리오시티',          address: '서울 송파구 가락동', lat: 37.498, lng: 127.121 },
  { aptId: 'APT007', aptName: '래미안퍼스티지',      address: '서울 서초구 반포동', lat: 37.505, lng: 126.998 },
  { aptId: 'APT008', aptName: '아크로리버파크',      address: '서울 서초구 반포동', lat: 37.506, lng: 126.997 },
  { aptId: 'APT009', aptName: '마포래미안푸르지오',  address: '서울 마포구 아현동', lat: 37.549, lng: 126.954 },
]

export const USE_MOCK_SEARCH = true

export const searchApartmentsMock = (keyword: string): Apartment[] => {
  const all = [...mockSearchResults, ...mockPopularApartments]
  const unique = all.filter((apt, i, arr) =>
    arr.findIndex(a => a.aptId === apt.aptId) === i
  )
  return unique.filter(
    apt => apt.aptName.includes(keyword) || apt.address.includes(keyword)
  )
}
