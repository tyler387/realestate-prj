type EmptyStateProps = {
  message?: string
  title?: string
  icon?: string
}

export const EmptyState = ({ message, title, icon = '📭' }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <span className="mb-2 text-4xl">{icon}</span>
    <p className="text-sm">{title ?? message}</p>
  </div>
)
