import { ApartmentInfoCard } from '../features/sidebar/ApartmentInfoCard'
import { TrendingKeywords } from '../features/sidebar/TrendingKeywords'

export const LeftSidebar = ({ aptId }: { aptId: string }) => (
  <div>
    <ApartmentInfoCard aptId={aptId} />
    <TrendingKeywords aptId={aptId} />
  </div>
)
