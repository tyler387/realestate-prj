const colorMap: Record<string, string> = {
  자유: 'bg-gray-100 text-gray-600',
  질문: 'bg-blue-50 text-blue-600',
  정보: 'bg-green-50 text-green-600',
  민원: 'bg-red-50 text-red-600',
  거래: 'bg-yellow-50 text-yellow-600',
}

export const Badge = ({ label }: { label: string }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[label] ?? 'bg-gray-100 text-gray-600'}`}>
    {label}
  </span>
)
