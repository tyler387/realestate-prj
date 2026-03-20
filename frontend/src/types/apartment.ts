export type ApartmentMarker = {
  id: number
  complexName: string
  eupMyeonDong: string
  latitude: number
  longitude: number
  latestSalePrice: number | null
  latestSaleArea: number | null
  latestTradeDate: string | null
}

export type MapBounds = {
  swLng: number
  swLat: number
  neLng: number
  neLat: number
}
