import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserInfoCard } from '../components/features/mypage/UserInfoCard'
import { TabMenu } from '../components/features/mypage/TabMenu'
import { MyPostList } from '../components/features/mypage/MyPostList'
import { MyCommentList } from '../components/features/mypage/MyCommentList'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { authApi } from '../services/authService'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

type Tab = '내 게시글' | '내 댓글'

export const MyPage = () => {
  const navigate = useNavigate()
  const logout = useUserStore((s) => s.logout)
  const oauthProvider = useUserStore((s) => s.oauthProvider)

  const [activeTab, setActiveTab] = useState<Tab>('내 게시글')
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const showToast = useUiStore((s) => s.showToast)

  const handleLogout = () => {
    logout()
    showToast('로그아웃 되었어요', 'info')
    navigate('/')
  }

  const handleWithdraw = async () => {
    if (isWithdrawing) return
    setIsWithdrawing(true)
    try {
      // 게시글·댓글 익명화 후 계정 삭제 → 클라이언트도 로그아웃 처리
      await authApi.deleteAccount()
      logout()
      showToast('탈퇴 처리가 완료되었어요', 'info')
      navigate('/', { replace: true })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '탈퇴에 실패했어요. 다시 시도해주세요.', 'error')
      setShowWithdrawDialog(false)
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="flex flex-col pb-24">
      <UserInfoCard />
      <TabMenu active={activeTab} onChange={setActiveTab} />
      {activeTab === '내 게시글' ? <MyPostList /> : <MyCommentList />}

      <div className="mt-6 space-y-2 px-4">
        {/* 소셜 계정은 password_hash가 없으므로 비밀번호 변경 비활성화 */}
        <button
          onClick={() => navigate('/change-password')}
          disabled={!!oauthProvider}
          className={`w-full rounded-lg border border-gray-200 py-3 text-sm ${
            oauthProvider
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {oauthProvider ? '비밀번호 변경 (소셜 계정)' : '비밀번호 변경'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-200 py-3 text-sm text-gray-500 hover:bg-gray-50"
        >
          로그아웃
        </button>

        <button
          onClick={() => setShowWithdrawDialog(true)}
          className="w-full rounded-lg py-3 text-sm text-red-400 hover:bg-red-50"
        >
          회원 탈퇴
        </button>
      </div>

      {showWithdrawDialog && (
        <ConfirmDialog
          message="정말 탈퇴하시겠습니까? 작성한 게시글과 댓글은 익명으로 처리됩니다."
          confirmLabel={isWithdrawing ? '처리 중...' : '탈퇴'}
          confirmDisabled={isWithdrawing}
          onConfirm={handleWithdraw}
          onCancel={() => !isWithdrawing && setShowWithdrawDialog(false)}
        />
      )}
    </div>
  )
}
