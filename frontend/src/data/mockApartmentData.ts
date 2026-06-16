import type { Apartment } from '../types'

export const USE_MOCK_SEARCH = import.meta.env.VITE_USE_MOCK_SEARCH === 'true'

export const mockSearchResults: Apartment[] = [
  { aptId: '1', aptName: '잠실엘스', address: '서울 송파구 올림픽로 99', lat: 37.5133, lng: 127.0803 },
  { aptId: '2', aptName: '리센츠', address: '서울 송파구 올림픽로 135', lat: 37.5119, lng: 127.0872 },
  { aptId: '3', aptName: '트리지움', address: '서울 송파구 석촌호수로 61', lat: 37.5087, lng: 127.0877 },
  { aptId: '4', aptName: '파크리오', address: '서울 송파구 올림픽로 435', lat: 37.5202, lng: 127.1122 },
  { aptId: '5', aptName: '헬리오시티', address: '서울 송파구 송파대로 345', lat: 37.4978, lng: 127.1034 },
]

export const mockPopularApartments: Apartment[] = [
  { aptId: '1', aptName: '잠실엘스', address: '서울 송파구 올림픽로 99', lat: 37.5133, lng: 127.0803 },
  { aptId: '5', aptName: '헬리오시티', address: '서울 송파구 송파대로 345', lat: 37.4978, lng: 127.1034 },
  { aptId: '6', aptName: '래미안 원베일리', address: '서울 서초구 반포대로 333', lat: 37.5077, lng: 126.9941 },
  { aptId: '7', aptName: '아크로리버파크', address: '서울 서초구 신반포로15길 19', lat: 37.5066, lng: 126.9913 },
  { aptId: '8', aptName: '마포래미안푸르지오', address: '서울 마포구 마포대로 195', lat: 37.5545, lng: 126.9535 },
]

export const searchApartmentsMock = (keyword: string): Apartment[] => {
  const normalizedKeyword = keyword.trim().toLowerCase()
  const apartments = [...mockSearchResults, ...mockPopularApartments]
  const uniqueApartments = apartments.filter((apt, index, array) =>
    array.findIndex((item) => item.aptId === apt.aptId) === index
  )

  return uniqueApartments.filter((apt) =>
    apt.aptName.toLowerCase().includes(normalizedKeyword) ||
    apt.address.toLowerCase().includes(normalizedKeyword)
  )
}
