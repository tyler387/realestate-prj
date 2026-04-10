import type { ReactNode } from 'react'

export const SidebarCard = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4">
    {children}
  </div>
)

export const CardTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-3 text-sm font-bold text-gray-700">{children}</h3>
)

export const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b border-gray-100 py-1 text-xs last:border-b-0">
    <span className="text-gray-400">{label}</span>
    <span className="font-medium text-gray-700">{value}</span>
  </div>
)
