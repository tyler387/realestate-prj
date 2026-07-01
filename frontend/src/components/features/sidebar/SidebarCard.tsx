import type { ReactNode } from 'react'

type SidebarCardProps = {
  children: ReactNode
  className?: string
}

export const SidebarCard = ({ children, className = '' }: SidebarCardProps) => (
  <div className={`mb-4 rounded-xl border border-line-base bg-surface-base p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] ${className}`.trim()}>
    {children}
  </div>
)

export const CardTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-3 text-sm font-bold text-text-strong">{children}</h3>
)

export const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b border-line-base py-1 text-xs last:border-b-0">
    <span className="text-text-subtle">{label}</span>
    <span className="font-semibold text-text-body">{value}</span>
  </div>
)
