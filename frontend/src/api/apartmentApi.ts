import axios from 'axios'
import type { ApartmentMarker, MapBounds } from '../types/apartment'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081',
  timeout: 10000,
})

export const apartmentApi = {
  async getMarkers(bounds: MapBounds): Promise<ApartmentMarker[]> {
    const response = await apiClient.get<ApartmentMarker[]>('/api/v1/apartments/markers', {
      params: bounds,
    })
    return response.data
  },
}
