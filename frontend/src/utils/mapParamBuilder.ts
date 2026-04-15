import type { MapViewBounds, MapFilters } from '../types/map'

export const buildParams = (
  bounds:    MapViewBounds,
  filters:   MapFilters,
  zoomLevel: number
): string => {
  const p = new URLSearchParams({
    minLat:    String(bounds.minLat),
    maxLat:    String(bounds.maxLat),
    minLng:    String(bounds.minLng),
    maxLng:    String(bounds.maxLng),
    zoomLevel: String(zoomLevel),
  })
  if (filters.dealType)         p.append('dealType',  filters.dealType)
  if (filters.minPrice != null) p.append('minPrice',  String(filters.minPrice))
  if (filters.maxPrice != null) p.append('maxPrice',  String(filters.maxPrice))
  if (filters.areaRange)        p.append('areaRange', filters.areaRange)
  return p.toString()
}
