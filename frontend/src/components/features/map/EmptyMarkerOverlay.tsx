export const EmptyMarkerOverlay = () => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                  pointer-events-none">
    <div className="bg-white/90 rounded-xl px-4 py-3 shadow-md
                    text-sm text-gray-500 whitespace-nowrap">
      조건에 맞는 아파트가 없어요
    </div>
  </div>
)
