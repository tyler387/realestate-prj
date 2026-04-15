export type ApartmentMarker = {
  id: number
  complexName: string
  eupMyeonDong: string
  latitude: number
  longitude: number
  latestSalePrice: number | null
  latestSaleArea: number | null
  latestTradeDate: string | null
  latestJeonsePrice?: number | null
  latestMonthlyDeposit?: number | null
  latestMonthlyRent?: number | null
  yearBuilt?: number | null
  totalHouseholds?: number | null
}

export type MapBounds = {
  swLng: number
  swLat: number
  neLng: number
  neLat: number
}

export type Apartment = {
  aptId: string
  aptName: string
  address: string
  lat: number
  lng: number
}
