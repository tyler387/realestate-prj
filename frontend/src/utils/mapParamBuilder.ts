import type { MapViewBounds, MapFilters } from '../types/map'

export const buildParams = (
  bounds:    MapViewBounds,
  filters:   MapFilters,
  zoomLevel: number
): string => {
  const p = new URLSearchParams({
    swLat:     String(bounds.minLat),
    neLat:     String(bounds.maxLat),
    swLng:     String(bounds.minLng),
    neLng:     String(bounds.maxLng),
    zoomLevel: String(zoomLevel),
  })
  if (filters.dealType)         p.append('dealType',  filters.dealType)
  if (filters.minPrice != null) p.append('minPrice',  String(filters.minPrice))
  if (filters.maxPrice != null) p.append('maxPrice',  String(filters.maxPrice))
  if (filters.areaRange)        p.append('areaRange', filters.areaRange)
  return p.toString()
}
