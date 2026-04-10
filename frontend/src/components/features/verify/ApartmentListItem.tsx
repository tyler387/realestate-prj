type Props = {
  apartment: { id: number; name: string; address: string; household: number }
  onVerify: (apartment: { id: number; name: string }) => void
}

export const ApartmentListItem = ({ apartment, onVerify }: Props) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{apartment.name}</p>
        <p className="text-xs text-gray-400">
          {apartment.address} · {apartment.household.toLocaleString()}세대
        </p>
      </div>
      <button
        onClick={() => onVerify({ id: apartment.id, name: apartment.name })}
        className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
      >
        인증
      </button>
    </div>
  )
}
