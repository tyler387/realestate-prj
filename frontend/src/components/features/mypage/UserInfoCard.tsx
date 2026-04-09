import { useUserStore } from '../../../stores/userStore'

export const UserInfoCard = () => {
  const user = useUserStore((s) => s.user)

  if (!user) return null

  return (
    <div className="bg-white px-4 py-5">
      <p className="text-base font-bold text-gray-900">{user.nickname}</p>
      <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
        <span>{user.complexName}</span>
        {user.verified && (
          <span className="flex items-center gap-0.5 text-blue-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            인증완료
          </span>
        )}
      </div>
    </div>
  )
}
