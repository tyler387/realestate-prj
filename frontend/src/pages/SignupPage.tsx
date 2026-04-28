import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepIndicator } from '../components/features/auth/StepIndicator'
import { StepNavigation } from '../components/features/auth/StepNavigation'
import { TermsBottomSheet } from '../components/features/auth/TermsBottomSheet'
import { getRandomNickname } from '../data/mockAuthData'
import { authApi, tokenStorage } from '../services/authService'
import { useUserStore } from '../stores/userStore'

type TermsKey = 'service' | 'privacy' | 'marketing'

type TermsState = {
  service: boolean
  privacy: boolean
  marketing: boolean
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const SignupPage = () => {
  const navigate = useNavigate()
  const setUser = useUserStore((s) => s.setUser)

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [isUsedEmail, setIsUsedEmail] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [nickname, setNickname] = useState('')
  const [isUsedNickname, setIsUsedNickname] = useState(false)

  const [terms, setTerms] = useState<TermsState>({
    service: false,
    privacy: false,
    marketing: false,
  })

  const [openedTerm, setOpenedTerm] = useState<TermsKey | null>(null)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [signupError, setSignupError] = useState('')

  useEffect(() => {
    if (!email || !emailRegex.test(email)) {
      setIsUsedEmail(false)
      return
    }
    const timer = window.setTimeout(async () => {
      try {
        const { available } = await authApi.checkEmail(email.trim().toLowerCase())
        setIsUsedEmail(!available)
      } catch {
        setIsUsedEmail(false)
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [email])

  useEffect(() => {
    if (!nickname || nickname.length < 2) {
      setIsUsedNickname(false)
      return
    }
    const timer = window.setTimeout(async () => {
      try {
        const { available } = await authApi.checkNickname(nickname.trim())
        setIsUsedNickname(!available)
      } catch {
        setIsUsedNickname(false)
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [nickname])

  const hasEng = /[a-zA-Z]/.test(password)
  const hasNum = /\d/.test(password)
  const hasLength = password.length >= 8
  const passwordMatched = confirmPassword.length > 0 && password === confirmPassword
  const hasSpecialInNickname = /[^a-zA-Z0-9가-힣_]/.test(nickname)

  const canProceed = useMemo(() => {
    if (step === 1) return emailRegex.test(email) && !isUsedEmail
    if (step === 2) return hasEng && hasNum && hasLength && passwordMatched
    if (step === 3) return nickname.length >= 2 && nickname.length <= 10 && !hasSpecialInNickname && !isUsedNickname
    if (step === 4) return terms.service && terms.privacy && !isSigningUp
    return true
  }, [
    step,
    email,
    isUsedEmail,
    hasEng,
    hasNum,
    hasLength,
    passwordMatched,
    nickname.length,
    hasSpecialInNickname,
    isUsedNickname,
    terms,
    isSigningUp,
  ])

  const handlePrev = () => setStep((value) => Math.max(1, value - 1))
  const handleNext = async () => {
    if (!canProceed || isSigningUp) return

    // Step 4 → 5 전환 시 실제 회원가입 API 호출
    if (step === 4) {
      setIsSigningUp(true)
      setSignupError('')
      try {
        const res = await authApi.signup({
          email,
          password,
          nickname,
          serviceAgreed:   terms.service,
          privacyAgreed:   terms.privacy,
          marketingAgreed: terms.marketing,
        })
        tokenStorage.set(res.token)
        setUser({
          userId:        res.userId,
          nickname:      res.nickname,
          status:        'MEMBER',
          apartmentId:   null,
          apartmentName: null,
        })
        setStep(5)
      } catch (e) {
        setSignupError(e instanceof Error ? e.message : '회원가입에 실패했어요. 다시 시도해주세요.')
      } finally {
        setIsSigningUp(false)
      }
      return
    }

    setStep((value) => Math.min(5, value + 1))
  }

  const allChecked = terms.service && terms.privacy && terms.marketing

  return (
    <div className={`flex min-h-full flex-col pt-0 ${step === 5 ? 'pb-10' : 'pb-24'}`}>
      <StepIndicator step={step} />

      <div className="flex-1 overflow-y-auto px-6">
        {step === 1 && (
          <section className="mt-6">
            <h2 className="text-xl font-bold text-gray-900">이메일을 입력해주세요</h2>
            <p className="mb-6 mt-1 text-sm text-gray-500">로그인에 사용할 이메일이에요</p>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일을 입력하세요"
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-blue-500"
            />
            {email.length > 0 && !emailRegex.test(email) && (
              <p className="mt-1 text-xs text-red-500">올바른 이메일 형식이 아니에요</p>
            )}
            {isUsedEmail && <p className="mt-1 text-xs text-red-500">이미 사용 중인 이메일이에요</p>}
          </section>
        )}

        {step === 2 && (
          <section className="mt-6">
            <h2 className="mb-6 text-xl font-bold text-gray-900">비밀번호를 설정해주세요</h2>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호 (8자 이상)"
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-blue-500"
            />
            <div className="mt-2 space-y-1 text-xs">
              <p className={hasLength ? 'text-green-500' : 'text-gray-400'}>{hasLength ? '✅' : '❌'} 8자 이상</p>
              <p className={hasEng ? 'text-green-500' : 'text-gray-400'}>{hasEng ? '✅' : '❌'} 영문 포함</p>
              <p className={hasNum ? 'text-green-500' : 'text-gray-400'}>{hasNum ? '✅' : '❌'} 숫자 포함</p>
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="비밀번호 확인"
              className="mt-3 h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-blue-500"
            />
            {confirmPassword.length > 0 && (
              <p className={`mt-1 text-xs ${passwordMatched ? 'text-green-500' : 'text-red-500'}`}>
                {passwordMatched ? '비밀번호가 일치해요 ✓' : '비밀번호가 일치하지 않아요'}
              </p>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="mt-6">
            <h2 className="text-xl font-bold text-gray-900">닉네임을 설정해주세요</h2>
            <p className="mb-6 mt-1 text-sm text-gray-500">다른 주민들에게 보여지는 이름이에요</p>
            <div className="relative">
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value.slice(0, 10))}
                placeholder="닉네임 입력 (2~10자)"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 pr-16 text-sm outline-none focus:border-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">{nickname.length}/10</span>
            </div>
            <button onClick={() => setNickname(getRandomNickname())} className="mt-3 text-sm text-blue-500">
              🎲 랜덤 닉네임 추천
            </button>
            {nickname.length > 0 && nickname.length < 2 && <p className="mt-1 text-xs text-red-500">2자 이상 입력해주세요</p>}
            {hasSpecialInNickname && <p className="mt-1 text-xs text-red-500">특수문자는 사용할 수 없어요</p>}
            {isUsedNickname && <p className="mt-1 text-xs text-red-500">이미 사용 중인 닉네임이에요</p>}
          </section>
        )}

        {step === 4 && (
          <section className="mt-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">약관에 동의해주세요</h2>
            {signupError && (
              <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{signupError}</p>
            )}
            <div className="rounded-xl border border-gray-100 bg-white px-4">
              <label className="mb-3 flex items-center gap-3 border-b border-gray-100 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setTerms({ service: checked, privacy: checked, marketing: checked })
                  }}
                  className="h-5 w-5"
                />
                <span className="text-sm font-semibold">전체 동의</span>
              </label>

              {([
                { key: 'service', label: '(필수) 서비스 이용약관' },
                { key: 'privacy', label: '(필수) 개인정보 처리방침' },
                { key: 'marketing', label: '(선택) 마케팅 정보 수신' },
              ] as { key: TermsKey; label: string }[]).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-b-0">
                  <input
                    type="checkbox"
                    checked={terms[key]}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setTerms((prev) => ({ ...prev, [key]: checked }))
                    }}
                    className="h-5 w-5"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                  <button className="ml-auto text-xs text-gray-400 underline" onClick={() => setOpenedTerm(key)}>
                    보기
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="mt-6 px-2">
            <h2 className="text-center text-xl font-bold text-gray-900">거의 다 왔어요! 🎉</h2>
            <p className="mt-2 whitespace-pre-line text-center text-sm text-gray-500">
              거주지를 인증하면{`\n`}모든 기능을 이용할 수 있어요
            </p>
            <div className="mx-4 mt-6 rounded-2xl bg-blue-50 p-8 text-center">
              <p className="text-5xl">🏠</p>
              <p className="mt-2 text-sm text-blue-500">우리 동네 커뮤니티</p>
            </div>
            <div className="mt-6 space-y-2 px-4 text-sm text-gray-700">
              <p>✅ 우리 아파트 게시판에 글쓰기</p>
              <p>✅ 이웃 주민과 댓글로 소통</p>
              <p>✅ 같은 단지 실거래 정보 먼저 보기</p>
            </div>
            <div className="mt-8 px-4">
              <button
                onClick={() => navigate('/verify', { state: { from: '/signup' } })}
                className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white"
              >
                지금 거주지 인증하기
              </button>
              <button
                onClick={() => navigate('/signup/done', { replace: true })}
                className="mt-3 h-10 w-full text-sm text-gray-400"
              >
                나중에 할게요
              </button>
            </div>
          </section>
        )}
      </div>

      <StepNavigation currentStep={step} canProceed={canProceed} onPrev={handlePrev} onNext={handleNext} />

      <TermsBottomSheet isOpen={openedTerm !== null} termKey={openedTerm} onClose={() => setOpenedTerm(null)} />
    </div>
  )
}
