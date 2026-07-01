type EmptyStateProps = {
  message?: string
  title?: string
  icon?: string
}

export const EmptyState = ({ message, title, icon = '📭' }: EmptyStateProps) => (
  <div className="mx-4 my-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-line-base bg-surface-base px-6 py-12 text-center">
    <span className="mb-3 text-3xl leading-none opacity-80">{icon}</span>
    <p className="text-sm font-medium text-text-muted">{title ?? message}</p>
  </div>
)
