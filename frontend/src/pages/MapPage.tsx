import { useState } from 'react'
import { MapView } from '../components/MapView'
import { ApartmentPanel } from '../components/features/map/ApartmentPanel'
import type { ApartmentMarker } from '../types'

export const MapPage = () => {
  const [, setMap] = useState<any | null>(null)
  const [selectedApartment] = useState<ApartmentMarker | null>(null)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <MapView onMapReady={setMap} />
      </div>
      <ApartmentPanel apartment={selectedApartment} />
    </div>
  )
}
