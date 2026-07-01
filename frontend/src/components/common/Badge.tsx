const colorMap: Record<string, string> = {
  자유: 'border-line-base bg-surface-soft text-text-body',
  질문: 'border-brand-100 bg-brand-50 text-brand-700',
  정보: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  민원: 'border-red-100 bg-red-50 text-red-600',
  거래: 'border-amber-100 bg-amber-50 text-amber-700',
}

export const Badge = ({ label }: { label: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-5 ${
      colorMap[label] ?? 'border-line-base bg-surface-soft text-text-body'
    }`}
  >
    {label}
  </span>
)
