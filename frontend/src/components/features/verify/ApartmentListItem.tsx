import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../../stores/userStore'

type Props = {
  apartment: { id: number; name: string; address: string; household: number }
}

export const ApartmentListItem = ({ apartment }: Props) => {
  const navigate = useNavigate()
  const setUser = useUserStore((s) => s.setUser)
  const user = useUserStore((s) => s.user)

  const handleVerify = () => {
    setUser({
      id: user?.id ?? 1,
      nickname: `${apartment.name}_익명`,
      complexName: apartment.name,
      verified: true,
    })
    navigate('/')
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{apartment.name}</p>
        <p className="text-xs text-gray-400">{apartment.address} · {apartment.household.toLocaleString()}세대</p>
      </div>
      <button
        onClick={handleVerify}
        className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
      >
        인증
      </button>
    </div>
  )
}
