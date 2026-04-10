export const TradeRankingCardSkeleton = () => (
  <div className="mx-4 mb-2 flex animate-pulse items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
    <div className="h-6 w-8 rounded bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="h-3 w-24 rounded bg-gray-200" />
      <div className="h-3 w-20 rounded bg-gray-200" />
    </div>
    <div className="space-y-2 text-right">
      <div className="ml-auto h-4 w-10 rounded bg-gray-200" />
      <div className="ml-auto h-3 w-12 rounded bg-gray-200" />
    </div>
  </div>
)
