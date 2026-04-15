export type MapDealType  = 'SALE' | 'JEONSE' | null
export type MapAreaRange = '20' | '30' | '40' | null

export type MapFilters = {
  dealType:  MapDealType
  minPrice:  number | null   // 만원 단위
  maxPrice:  number | null   // 만원 단위
  areaRange: MapAreaRange
}

// 지도 뷰포트 범위 (mapParamBuilder / useMapMarkers 전용)
export type MapViewBounds = {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export type MapMarkerItem = {
  aptId:   string
  aptName: string
  lat:     number
  lng:     number
  price:   number   // 만원 단위
}
