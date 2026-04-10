import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserInfoCard } from '../components/features/mypage/UserInfoCard'
import { TabMenu } from '../components/features/mypage/TabMenu'
import { MyPostList } from '../components/features/mypage/MyPostList'
import { MyCommentList } from '../components/features/mypage/MyCommentList'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

type Tab = '내 게시글' | '내 댓글'

export const MyPage = () => {
  const navigate = useNavigate()
  const logout = useUserStore((s) => s.logout)
  const [activeTab, setActiveTab] = useState<Tab>('내 게시글')
  const showToast = useUiStore((s) => s.showToast)

  const handleLogout = () => {
    logout()
    showToast('로그아웃 되었어요', 'info')
    navigate('/')
  }

  return (
    <div className="flex flex-col pb-24">
      <UserInfoCard />
      <TabMenu active={activeTab} onChange={setActiveTab} />
      {activeTab === '내 게시글' ? <MyPostList /> : <MyCommentList />}
      <div className="mt-6 px-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-200 py-3 text-sm text-gray-500 hover:bg-gray-50"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
