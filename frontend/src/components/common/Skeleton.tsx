export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
)

export const PostCardSkeleton = () => (
  <div className="bg-white p-4">
    <Skeleton className="mb-2 h-4 w-16" />
    <Skeleton className="mb-1 h-5 w-3/4" />
    <Skeleton className="mb-3 h-4 w-full" />
    <Skeleton className="h-3 w-1/3" />
  </div>
)
