import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

export const FilterGroup = ({ label, children }: Props) => (
  <div className="mt-3 first:mt-0">
    <p className="mb-1.5 text-xs font-medium text-gray-500">{label}</p>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
)
