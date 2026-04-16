import { type TopTransactionApartment } from '../../../types/sidebar'

type Props = {
  apt: TopTransactionApartment
  onClick: () => void
}

export const TopAptItem = ({ apt, onClick }: Props) => (
  <div
    onClick={onClick}
    className="-mx-1 flex cursor-pointer items-center gap-2 rounded border-b border-gray-100 px-1 py-2 transition-colors last:border-b-0 hover:bg-gray-50"
  >
    <span className={`w-5 shrink-0 text-center text-sm font-bold ${apt.rank <= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
      {apt.rank}
    </span>
    <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{apt.aptName}</span>
    <span className="shrink-0 text-xs font-semibold text-blue-500">{apt.transactionCount}건</span>
  </div>
)
