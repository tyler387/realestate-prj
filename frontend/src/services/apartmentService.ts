import type { Apartment } from '../types'
import {
  USE_MOCK_SEARCH,
  mockPopularApartments,
  searchApartmentsMock,
} from '../data/mockApartmentData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

type ApartmentSearchResponse = {
  id: number
  complexName: string
  roadAddress: string | null
  sigungu: string | null
  eupMyeonDong: string | null
  latitude: number | null
  longitude: number | null
}

const toApartment = (data: ApartmentSearchResponse): Apartment => ({
  aptId:   String(data.id),
  aptName: data.complexName,
  address: data.roadAddress ?? [data.sigungu, data.eupMyeonDong].filter(Boolean).join(' '),
  lat:     data.latitude ?? 0,
  lng:     data.longitude ?? 0,
})

const fetchApartments = async (path: string): Promise<Apartment[]> => {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error('Apartment request failed')
  }

  const data: ApartmentSearchResponse[] = await response.json()
  return data.map(toApartment)
}

export const searchApartments = async (keyword: string): Promise<Apartment[]> => {
  if (USE_MOCK_SEARCH) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return searchApartmentsMock(keyword)
  }

  return fetchApartments(`/api/v1/apartments/search?keyword=${encodeURIComponent(keyword)}`)
}

export const getPopularApartments = async (): Promise<Apartment[]> => {
  if (USE_MOCK_SEARCH) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    return mockPopularApartments
  }

  return fetchApartments('/api/v1/apartments/popular')
}
