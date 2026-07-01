export const TradeRankingCardSkeleton = () => (
  <div className="mx-4 mb-3 flex animate-pulse items-center gap-3 rounded-xl border border-line-base bg-surface-base p-4">
    <div className="h-6 w-8 rounded bg-slate-200/80" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-32 rounded bg-slate-200/80" />
      <div className="h-3 w-24 rounded bg-slate-200/80" />
      <div className="h-3 w-20 rounded bg-slate-200/80" />
    </div>
    <div className="space-y-2 text-right">
      <div className="ml-auto h-4 w-10 rounded bg-slate-200/80" />
      <div className="ml-auto h-3 w-12 rounded bg-slate-200/80" />
    </div>
  </div>
)
