import { ApartmentInfoCard } from '../features/sidebar/ApartmentInfoCard'
import { TrendingKeywords } from '../features/sidebar/TrendingKeywords'
import { ApartmentSearchTrigger } from '../features/apartment-select/ApartmentSearchTrigger'

export const LeftSidebar = ({ aptId }: { aptId: string }) => (
  <div>
    <ApartmentSearchTrigger />
    <ApartmentInfoCard aptId={aptId} />
    <TrendingKeywords aptId={aptId} />
  </div>
)
