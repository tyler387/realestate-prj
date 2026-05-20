import { TradeSummaryCard } from '../features/trade-sidebar/TradeSummaryCard'
import { PriceTrendSummary } from '../features/trade-sidebar/PriceTrendSummary'
import { QuickFilters } from '../features/trade-sidebar/QuickFilters'

export const TradeLeftSidebar = () => (
  <div>
    <TradeSummaryCard />
    <PriceTrendSummary />
    <QuickFilters />
  </div>
)
