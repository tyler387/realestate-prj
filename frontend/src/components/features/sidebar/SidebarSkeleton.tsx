const SkeletonBox = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
)

export const ApartmentInfoCardSkeleton = () => (
  <div className="space-y-2">
    <SkeletonBox className="h-4 w-3/4" />
    <SkeletonBox className="h-3 w-1/2" />
    <div className="mt-3 space-y-2">
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-full" />
    </div>
  </div>
)

export const PostListSkeleton = () => (
  <div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-2 border-b border-gray-100 py-2 last:border-b-0">
        <SkeletonBox className="mt-0.5 h-3 w-4 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <SkeletonBox className="h-3 w-full" />
          <SkeletonBox className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

export const KeywordsSkeleton = () => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonBox key={i} className="h-6 w-14 rounded-full" />
    ))}
  </div>
)

export const PriceTrendSkeleton = () => (
  <div className="mt-3 space-y-2">
    <SkeletonBox className="h-3 w-1/2" />
    <SkeletonBox className="h-6 w-3/4" />
    <SkeletonBox className="h-3 w-1/3" />
  </div>
)

export const ErrorMessage = ({ text }: { text: string }) => (
  <p className="py-4 text-center text-xs text-gray-400">{text}</p>
)
