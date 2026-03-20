import { useState } from 'react'
import { MapView } from './components/MapView'
import { SearchBar } from './components/SearchBar'

export const App = () => {
  const [map, setMap] = useState<any | null>(null)

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <div className="flex h-full flex-col">
        <SearchBar map={map} />
        <div className="relative flex-1">
          <MapView onMapReady={setMap} />
        </div>
      </div>
    </div>
  )
}
