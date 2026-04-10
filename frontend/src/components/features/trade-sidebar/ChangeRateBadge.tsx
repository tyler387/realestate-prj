type Props = { rate: number }

export const ChangeRateBadge = ({ rate }: Props) => {
  if (rate > 0) return <span className="text-xs text-red-500">▲ {rate.toFixed(1)}%</span>
  if (rate < 0) return <span className="text-xs text-blue-400">▼ {Math.abs(rate).toFixed(1)}%</span>
  return <span className="text-xs text-gray-400">─</span>
}
