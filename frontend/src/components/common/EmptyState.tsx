export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <span className="mb-2 text-4xl">📭</span>
    <p className="text-sm">{message}</p>
  </div>
)
