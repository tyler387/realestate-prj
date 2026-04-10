# 📄 UI PRD — 로그인 / 회원가입 / 권한 관리
## v2.0 | 검증 완료 | 바이브 코딩용

> **범위**: 인증(Auth) UI 전체 — 로그인, 회원가입, 비회원 접근 제어, 권한별 UI 분기
> **연관 PRD**: UI Frame v4 / 실거래 탭 v2 / 커뮤니티 PRD
> **원칙**: 비회원도 조회 가능 / 글쓰기·댓글·좋아요는 VERIFIED만 가능
>
> **v2 검증 변경 요약**:
> - AuthBottomSheet Dim(z-50)과 FAB(z-50) z-index 충돌 → Dim z-55로 분리, 레이어 전체 재조정
> - VerifiedRoute의 `VerifyRequiredPage` 미명세 컴포넌트 → 명세 추가
> - 로그인 후 `navigate(-1)` 시 AuthBottomSheet 재노출 문제 → 리디렉션 로직 명세 보완
> - GuestBanner가 padding-top 안에 포함되는지 불명확 → 레이아웃 위치 명확화
> - `/login` 진입 경로별 복귀 목적지 미명세 → `redirectTo` state 패턴 추가
> - `/signup/done` Header 타이틀 미명세 → 추가
> - `TermsBottomSheet` z-index가 `AuthBottomSheet`보다 낮으면 가려짐 → z-80으로 수정
> - `StepNavigation` Step 5에서 fixed bottom과 VerifyGuideStep 버튼 2개 충돌 → Step 5는 StepNavigation 숨김으로 확정
> - `loginRequiredCommentInput` z-index 미명세 → z-40 명시

---

# 1. 사용자 유형 정의

```
GUEST     비회원 — 앱 진입 시 기본 상태. 로그인 없이 조회만 가능.
MEMBER    회원 (거주지 미인증) — 로그인 완료. 글쓰기/댓글/좋아요 불가.
VERIFIED  회원 (거주지 인증 완료) — 모든 기능 사용 가능.
```

> 기존 PRD의 `UNVERIFIED / VERIFIED` 2단계 →
> `GUEST / MEMBER / VERIFIED` 3단계로 확장.

---

# 2. 권한별 기능 매트릭스

| 기능 | GUEST | MEMBER | VERIFIED |
|------|:-----:|:------:|:--------:|
| 게시글 목록 조회 | ✅ | ✅ | ✅ |
| 게시글 상세 조회 | ✅ | ✅ | ✅ |
| 실거래 조회 | ✅ | ✅ | ✅ |
| 지도 조회 | ✅ | ✅ | ✅ |
| 댓글 조회 | ✅ | ✅ | ✅ |
| 좋아요 | ❌ | ❌ | ✅ |
| 댓글 작성 | ❌ | ❌ | ✅ |
| 게시글 작성 | ❌ | ❌ | ✅ |
| 관심 아파트 저장 | ❌ | ✅ | ✅ |
| 마이페이지 접근 | ❌ | ✅ | ✅ |
| 거주지 인증 | ❌ | ✅ | — |

---

# 3. 라우팅 추가

```
/login          → 로그인 페이지
/signup         → 회원가입 페이지 (5단계 스텝)
/signup/done    → 회원가입 완료 페이지
```

## Header 타이틀 매핑

```
/login        → "로그인"    패턴: ← + 타이틀 (우측 빈 w-10)
/signup       → "회원가입"  패턴: ← + 타이틀 (우측 빈 w-10)
/signup/done  → "가입 완료" 패턴: 타이틀만 (← 없음, 우측 빈 w-10)
```

> ⚠️ **[수정]** `/signup/done` Header 타이틀 미명세였음 → "가입 완료" 추가
> ⚠️ `/signup/done` 는 뒤로가기 없음 → `navigate('/signup/done', { replace: true })` 로 history 교체

## TabBar / FAB 표시 조건

| 요소 | /login | /signup | /signup/done |
|------|:------:|:-------:|:------------:|
| Header | ✅ | ✅ | ✅ |
| TabBar | ❌ | ❌ | ❌ |
| FAB | ❌ | ❌ | ❌ |

---

# 4. UserStore 확장

```ts
type AuthStatus = 'GUEST' | 'MEMBER' | 'VERIFIED'

type UserState = {
  userId: number | null
  nickname: string | null
  status: AuthStatus
  apartmentId: number | null
  apartmentName: string | null

  setUser: (user: Partial<Omit<UserState, 'setUser' | 'logout'>>) => void
  logout: () => void   // status → 'GUEST', 나머지 null 초기화
}

// 초기값
const initialState = {
  userId: null,
  nickname: null,
  status: 'GUEST' as AuthStatus,
  apartmentId: null,
  apartmentName: null,
}
```

---

# 5. 전역 상태 흐름

```
앱 진입 → status = 'GUEST'
  ├─ 조회 기능 전체 허용
  ├─ 글쓰기 / 댓글 / 좋아요 → AuthBottomSheet (GUEST)
  └─ 마이페이지 헤더 👤 → /login 리디렉션

로그인 완료 → status = 'MEMBER'
  ├─ 조회 + 관심 아파트 허용
  ├─ 글쓰기 / 댓글 / 좋아요 → AuthBottomSheet (MEMBER, 거주지 인증 유도)
  └─ 마이페이지 정상 접근

거주지 인증 완료 → status = 'VERIFIED'
  └─ 모든 기능 허용
```

---

# 6. z-index 레이어 전체 (업데이트)

```
z-80  TermsBottomSheet          ← 약관 시트 (최상위, AuthBottomSheet 위에서 열림)
z-70  AuthBottomSheet 시트 본체
z-60  AuthBottomSheet Dim (배경 딤)
z-50  FloatingWriteButton (FAB)
z-40  CommentInput / LoginRequiredCommentInput
z-30  Header
z-20  TabBar
z-10  ApartmentPanel
z-0   MainContent
```

> ⚠️ **[수정 핵심]** v1에서 Dim이 z-50, FAB도 z-50으로 동일 레벨 → 충돌.
> Dim이 FAB 위에 있어야 FAB가 시트 뒤로 가려져야 정상.
> 새 레이어: Dim z-60 / 시트 z-70 / FAB z-50 으로 분리.
> TermsBottomSheet는 AuthBottomSheet 위에서 열려야 하므로 z-80.

---

# 7. 공통 컴포넌트

---

## 7.1 AuthBottomSheet

```
역할:
  GUEST / MEMBER 상태에서 제한 기능 접근 시 표시.
  페이지 이동 없이 인라인 유도.

트리거:
  GUEST  → FAB 클릭 / LoginRequiredCommentInput 탭 / LikeButton 탭
  MEMBER → FAB 클릭 / LoginRequiredCommentInput 탭 / LikeButton 탭
  /map ApartmentPanel [글쓰기] 탭

레이어:
  Dim:   fixed inset-0 bg-black/40 z-60   ← FAB(z-50) 위에서 FAB를 가림
  시트:  fixed bottom-0 w-full z-70
         bg-white rounded-t-2xl shadow-2xl
         px-6 pt-4 pb-10

핸들바: 상단 중앙 w-10 h-1 bg-gray-200 rounded-full mb-5

[GUEST 상태]
──────────────────────────────
  핸들바
  로그인이 필요해요          (text-lg font-bold text-gray-900)
  회원만 글을 쓸 수 있어요   (text-sm text-gray-500 mt-1 mb-6)
  [로그인하기]               primary, w-full h-12
  [회원가입]                 secondary, w-full h-12 mt-3
  둘러보기                   ghost, w-full h-10 mt-2 text-gray-400

[MEMBER 상태]
──────────────────────────────
  핸들바
  거주지 인증이 필요해요     (text-lg font-bold text-gray-900)
  내 아파트 주민만           (text-sm text-gray-500 mt-1)
  글을 쓸 수 있어요          (text-sm text-gray-500 mb-6)
  [거주지 인증하기]          primary, w-full h-12
  나중에 할게요              ghost, w-full h-10 mt-2 text-gray-400

Dim 클릭 → 시트 닫힘
ESC 키    → 시트 닫힘 (웹 대응)

애니메이션:
  진입: translateY(100%) → translateY(0), 250ms ease-out
  퇴장: translateY(0) → translateY(100%), 200ms ease-in
  Dim:  opacity 0 → 0.4, 250ms
```

```ts
type AuthBottomSheetProps = {
  isOpen: boolean
  userStatus: 'GUEST' | 'MEMBER'
  onClose: () => void
  onLogin: () => void    // navigate('/login', { state: { redirectTo: currentPath } })
  onSignup: () => void   // navigate('/signup')
  onVerify: () => void   // navigate('/verify')
}
```

---

## 7.2 GuestBanner

```
역할: GUEST 상태에서 커뮤니티 메인(/) 상단에 표시되는 가입 유도 배너

레이아웃 위치:
  ⚠️ [수정] padding-top(104px) 범위 안에서 콘텐츠 최상단에 위치.
  별도 fixed/sticky 아님 → 스크롤 시 함께 올라감.
  CategoryFilter 바로 위에 렌더링.

  즉: MainContent 스크롤 영역 내 최상단 첫 번째 요소.

스타일:
  bg-blue-50 border-b border-blue-100
  px-4 py-3 flex items-center justify-between

구성:
  좌측: "👋 회원가입하고 이웃과 소통해보세요" (text-sm text-blue-700)
  우측 영역: [가입하기] (text-xs font-semibold text-blue-600)  +  ✕ (text-gray-400 ml-2)

동작:
  [가입하기] → navigate('/signup')
  ✕ 클릭    → 배너 로컬 state로 숨김 (sessionStorage 저장 불필요)

표시 조건: status === 'GUEST' && isBannerVisible === true
```

---

## 7.3 LoginRequiredCommentInput

```
역할:
  /post/:id 에서 GUEST/MEMBER 상태일 때 CommentInput 자리를 대체.

레이어: fixed bottom-0 w-full z-40 (CommentInput과 동일 레이어)

스타일:
  bg-gray-50 border-t border-gray-200
  h-14 (56px, CommentInput과 동일 높이)
  flex items-center justify-center
  cursor-pointer

텍스트:
  GUEST  → "로그인 후 댓글을 작성할 수 있어요"  text-sm text-gray-400
  MEMBER → "거주지 인증 후 댓글을 작성할 수 있어요"  text-sm text-gray-400

동작:
  전체 영역 탭 → isSheetOpen = true → AuthBottomSheet 표시

⚠️ padding-bottom 보정:
  PostDetailPage의 padding-bottom은 72px 유지
  (CommentInput이든 LoginRequiredCommentInput이든 동일 높이이므로 변경 없음)
```

---

## 7.4 VerifyRequiredPage ← [신규 명세]

```
역할:
  MEMBER 상태에서 /write 접근 시 VerifiedRoute가 렌더링하는 전용 페이지.
  빈 배경 위에 AuthBottomSheet(MEMBER)가 열린 상태로 표시.
  사용자가 "나중에 할게요" 선택 시 navigate(-1)로 이전 페이지 복귀.

구조:
  <VerifyRequiredPage>
    <AuthBottomSheet
      isOpen={true}                ← 항상 열린 채로 진입
      userStatus="MEMBER"
      onClose={() => navigate(-1)} ← 닫으면 이전 페이지로
      onVerify={() => navigate('/verify')}
    />
  </VerifyRequiredPage>

배경:
  이전 페이지의 스크린샷처럼 보이는 블러 배경 (선택)
  또는 단순 gray-50 배경

⚠️ 주의:
  이 페이지는 URL이 /write 이지만
  실제 WritePage 컴포넌트는 렌더링되지 않음.
  VerifiedRoute가 status === 'MEMBER' 일 때 WritePage 대신 이것을 반환.
```

---

# 8. 로그인 후 복귀 처리 (`redirectTo` 패턴)

> ⚠️ **[신규 명세]** v1에서 `navigate(-1)` 단순 사용 시 문제 발생:
> AuthBottomSheet → /login 이동 → 로그인 성공 → navigate(-1) →
> AuthBottomSheet가 열린 페이지로 돌아오지만 시트 state가 여전히 true일 수 있음.

## 해결 방법: location.state로 redirectTo 전달

```ts
// AuthBottomSheet에서 /login 이동 시
navigate('/login', {
  state: { redirectTo: location.pathname }  // 현재 페이지 경로 저장
})

// LoginPage 로그인 성공 후
const { redirectTo } = location.state || {}
navigate(redirectTo || '/', { replace: true })
// replace: true → /login을 history에서 제거
// AuthBottomSheet state는 새 페이지이므로 자동 초기화
```

## 적용 케이스별 복귀 목적지

| 진입 경로 | redirectTo | 로그인 후 복귀 |
|-----------|-----------|--------------|
| Header 👤 클릭 (GUEST) | '/' | / |
| FAB 클릭 → AuthBottomSheet → 로그인 | 현재 페이지 (/) | / |
| /mypage 직접 접근 (GUEST) | '/mypage' | /mypage |
| /post/:id 에서 좋아요/댓글 탭 | '/post/:id' | /post/:id |

---

# 9. 로그인 페이지 (`/login`)

## 화면 레이아웃

```
┌─────────────────────────────┐  ← Header (fixed, z-30)
│  ←    로그인                 │
├─────────────────────────────┤  padding-top: 56px, padding-bottom: 24px
│                              │
│          🏠                  │
│        동네톡                │  ← ServiceLogo (text-center, mt-8 mb-8)
│                              │
│  이메일                      │  ← Label (text-sm font-medium text-gray-700)
│  [이메일 입력             ]  │  ← EmailInput
│  올바른 이메일 형식이 아니에요│  ← 에러 (blur 시 표시)
│                              │
│  비밀번호                    │  ← Label
│  [비밀번호 입력        👁 ]  │  ← PasswordInput
│                              │
│  이메일 또는 비밀번호가...   │  ← 서버 에러 (제출 후 표시)
│                              │
│  [로그인]                    │  ← SubmitButton (w-full h-12)
│                              │
│      비밀번호를 잊으셨나요?   │  ← ForgotPasswordLink (text-center)
│                              │
│  ─────── 또는 ───────        │  ← Divider
│                              │
│  [카카오로 시작하기]          │
│  [Apple로 시작하기]           │
│                              │
│  계정이 없으신가요?  [회원가입]│
└─────────────────────────────┘
```

## 컴포넌트 트리

```
<LoginPage>                      ← flex-col, pt-[56px], px-6
  <ServiceLogo />
  <LoginForm>
    <FormField label="이메일">
      <EmailInput />
      <FieldError />             ← blur 시 표시
    </FormField>
    <FormField label="비밀번호">
      <PasswordInput />
    </FormField>
    <ServerError />              ← 로그인 실패 시 표시
    <LoginSubmitButton />
    <ForgotPasswordLink />
  </LoginForm>
  <SocialDivider />
  <SocialLoginButtons />
  <SignupLink />
</LoginPage>
```

## 컴포넌트 상세

### EmailInput

```ts
input type="email"
placeholder="이메일을 입력하세요"
autoComplete="email"
inputMode="email"   // 모바일 이메일 키보드

유효성 (onBlur 시 검사):
  비어있음:       "이메일을 입력해주세요"
  형식 불일치:    "올바른 이메일 형식이 아니에요"

에러 시 스타일: border-red-300 + bg-red-50
정상 스타일:    border-gray-200 focus:border-blue-500
```

### PasswordInput

```ts
input type="password" (기본) / type="text" (👁 토글)
placeholder="비밀번호를 입력하세요"
autoComplete="current-password"

우측 👁 버튼: w-10 h-full flex items-center justify-center text-gray-400
```

### LoginSubmitButton

```ts
활성 조건: email.length > 0 && password.length > 0
비활성:    bg-gray-200 text-gray-400 cursor-not-allowed

로딩 (클릭 후):
  버튼 내 Spinner (w-5 h-5 border-2 animate-spin) + disabled
  mock delay: 800ms

성공 처리 (mock):
  userStore.setUser({ status: 'MEMBER', userId: 1, nickname: '익명_1234' })
  const { redirectTo } = location.state || {}
  navigate(redirectTo || '/', { replace: true })
  Toast: "로그인 되었어요 👋"

실패 처리 (mock):
  ServerError 컴포넌트 표시: "이메일 또는 비밀번호가 올바르지 않아요"
  text-sm text-red-500, SubmitButton 위 영역
  isLoading = false
```

### SocialLoginButtons

```
KakaoLoginButton:
  bg-[#FEE500] text-[#191919] rounded-xl w-full h-12 font-medium
  좌측: 카카오 로고 SVG (20x20)
  텍스트: "카카오로 시작하기"

AppleLoginButton:
  bg-[#000000] text-white rounded-xl w-full h-12 font-medium mt-3
  좌측: Apple 로고 SVG (20x20)
  텍스트: "Apple로 시작하기"

동작 (mock):
  클릭 → Toast "준비 중인 기능이에요" (info)
  실제 OAuth 연동은 기능 PRD에서 별도 명세
```

### SignupLink

```
레이아웃: flex items-center justify-center gap-1 mt-6
텍스트:   "계정이 없으신가요?" text-sm text-gray-500
링크:     "회원가입" text-sm font-semibold text-blue-500
동작:     navigate('/signup')
```

---

# 10. 회원가입 페이지 (`/signup`)

## 전체 구조

```
<SignupPage>                     ← flex-col, pt-[56px], pb-[80px]
  <StepIndicator />              ← 상단 고정 (sticky top-14, bg-white, z-20)
  <StepContent>                  ← flex-1, overflow-y-auto, px-6
    {step === 1 && <EmailStep />}
    {step === 2 && <PasswordStep />}
    {step === 3 && <NicknameStep />}
    {step === 4 && <TermsStep />}
    {step === 5 && <VerifyGuideStep />}
  </StepContent>
  <StepNavigation />             ← fixed bottom-0 (step 5에서는 hidden)
</SignupPage>
```

> ⚠️ **[수정]** StepIndicator를 `sticky top-14`로 처리.
> fixed로 하면 또 다른 padding 계산이 필요해지고, 스텝 전환 시 콘텐츠가 가려짐.
> sticky가 더 단순하고 안전.

## 10.1 StepIndicator

```
위치: sticky top-14 (Header 56px 바로 아래), bg-white, z-20
높이: h-12 (48px)
레이아웃: flex items-center justify-center gap-2 py-3

dot 스타일:
  완료(이전 step): w-2.5 h-2.5 rounded-full bg-blue-500
  현재:            w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200
  미완료:          w-2.5 h-2.5 rounded-full bg-gray-200

우측 텍스트: "{step}/5단계" text-xs text-gray-400 absolute right-4
```

## 10.2 Step 1 — 이메일 입력

```
타이틀: "이메일을 입력해주세요"    text-xl font-bold text-gray-900 mt-6
서브:   "로그인에 사용할 이메일이에요"  text-sm text-gray-500 mt-1 mb-6

EmailInput (LoginPage와 동일 컴포넌트 재사용)
  + 실시간 중복 확인 (onChange 500ms debounce)
  + 중복: "이미 사용 중인 이메일이에요" text-xs text-red-500
  + mock 중복 이메일: ["test@test.com", "used@example.com"]

canProceed 조건: 이메일 형식 ✅ && 중복 아님 ✅
```

## 10.3 Step 2 — 비밀번호 설정

```
타이틀: "비밀번호를 설정해주세요"  text-xl font-bold mt-6 mb-6

PasswordInput (placeholder: "비밀번호 (8자 이상)")
PasswordConfirmInput (placeholder: "비밀번호 확인", mt-3)

유효성 체크리스트 (PasswordInput 하단, 실시간):
  ✅/❌ 8자 이상
  ✅/❌ 영문 포함
  ✅/❌ 숫자 포함
  스타일: text-xs, 완료 시 text-green-500, 미완료 text-gray-400

비밀번호 확인 피드백 (PasswordConfirmInput 하단):
  일치:   "비밀번호가 일치해요 ✓"  text-xs text-green-500
  불일치: "비밀번호가 일치하지 않아요"  text-xs text-red-500
  (confirm input에 값 있을 때만 표시)

canProceed 조건: 3개 체크리스트 모두 ✅ && 비밀번호 일치
```

## 10.4 Step 3 — 닉네임 설정

```
타이틀: "닉네임을 설정해주세요"   text-xl font-bold mt-6
서브:   "다른 주민들에게 보여지는 이름이에요"  text-sm text-gray-500 mt-1 mb-6

NicknameInput:
  placeholder: "닉네임 입력 (2~10자)"
  maxLength: 10
  우측: "{입력수}/10" text-xs text-gray-400

[🎲 랜덤 닉네임 추천] 버튼:
  Input 하단, text-sm text-blue-500
  클릭 → mockNicknames 배열에서 랜덤 1개 선택 → input에 자동 입력

유효성 (onChange 실시간):
  2자 미만:   "2자 이상 입력해주세요"
  특수문자:   "특수문자는 사용할 수 없어요"
  중복 (mock debounce): "이미 사용 중인 닉네임이에요"
  mock 중복:  ["익명_0000", "테스트유저"]

canProceed 조건: 2자 이상 && 특수문자 없음 && 중복 아님
```

## 10.5 Step 4 — 약관 동의

```
타이틀: "약관에 동의해주세요"  text-xl font-bold mt-6 mb-4

체크 목록:
  ┌─────────────────────────────────┐
  │ ☑  전체 동의                     │ ← AllAgreeCheckbox (border-b pb-3 mb-3)
  ├─────────────────────────────────┤
  │ ☑  (필수) 서비스 이용약관    [보기]│
  │ ☑  (필수) 개인정보 처리방침  [보기]│
  │ ☐  (선택) 마케팅 정보 수신   [보기]│
  └─────────────────────────────────┘

스타일:
  체크박스:  w-5 h-5 rounded border-gray-300
  checked:   bg-blue-500 border-blue-500 체크 아이콘 흰색
  항목 행:   flex items-center gap-3 py-3 border-b border-gray-100
  [보기]:    text-xs text-gray-400 underline ml-auto

동작:
  전체 동의 체크 → 하위 3개 모두 체크
  하위 모두 체크 → 전체 동의 자동 체크
  [보기] 클릭 → TermsBottomSheet 열림 (해당 약관 내용)

canProceed 조건: 필수 2개 모두 체크
```

## 10.6 Step 5 — 거주지 인증 안내

```
타이틀: "거의 다 왔어요! 🎉"      text-xl font-bold mt-6 text-center
서브:   "거주지를 인증하면\n모든 기능을 이용할 수 있어요"
        text-sm text-gray-500 mt-2 mb-6 text-center whitespace-pre-line

일러스트 영역:
  bg-blue-50 rounded-2xl p-8 mx-4 text-center
  🏠 아이콘 (text-5xl) + "우리 동네 커뮤니티" (text-sm text-blue-500 mt-2)

혜택 리스트 (mt-6 px-4):
  ✅ 우리 아파트 게시판에 글쓰기    text-sm text-gray-700
  ✅ 이웃 주민과 댓글로 소통        text-sm text-gray-700 mt-2
  ✅ 같은 단지 실거래 정보 먼저 보기 text-sm text-gray-700 mt-2

버튼 영역 (mt-8 px-4):
  [지금 거주지 인증하기]  primary  w-full h-12
    → navigate('/verify', { state: { from: '/signup' } })
    → /verify 완료 후: status=VERIFIED → navigate('/signup/done', { replace: true })

  [나중에 할게요]         ghost    w-full h-10 mt-3 text-gray-400
    → navigate('/signup/done', { replace: true })
    → status = 'MEMBER'

⚠️ [수정] Step 5에서는 StepNavigation(fixed bottom) 숨김.
  버튼 2개가 StepNavigation 역할을 대신.
  Step 5 콘텐츠 padding-bottom: 40px (fixed nav 없으므로 80px 불필요)
```

## 10.7 StepNavigation

```ts
type StepNavigationProps = {
  currentStep: number      // 1~5
  canProceed: boolean
  onPrev: () => void
  onNext: () => void
}

레이아웃: fixed bottom-0 w-full bg-white border-t border-gray-100
          px-4 py-3 flex gap-3
          ⚠️ step === 5 일 때: hidden (display: none)

[이전] 버튼:
  step 1:   hidden
  step 2~4: secondary variant, w-1/3, h-12

[다음] 버튼:
  step 1~4: primary variant, flex-1, h-12
  텍스트: step 4 → "다음", 나머지 → "다음"
  canProceed=false: bg-gray-200 text-gray-400 disabled pointer-events-none

padding-bottom 보정:
  SignupPage의 pb = 80px (StepNavigation h ≈ 64px + 여유)
  Step 5는 pb = 40px
```

---

# 11. 회원가입 완료 페이지 (`/signup/done`)

## 화면 레이아웃

```
┌─────────────────────────────┐  ← Header (fixed) "가입 완료" (뒤로가기 없음)
├─────────────────────────────┤  padding-top: 56px
│                              │
│                              │
│            🎉                │  ← text-6xl text-center mt-16
│                              │
│      {nickname}님,           │
│      가입을 환영해요!         │  ← text-2xl font-bold text-center mt-4
│                              │
│    동네 이웃들과 함께          │
│    우리 아파트 이야기를        │
│    나눠보세요                  │  ← text-sm text-gray-500 text-center mt-2
│                              │
│                              │
│    [커뮤니티 둘러보기]         │  ← primary, w-full h-12, mx-6, mt-12
│    [거주지 인증하기]           │  ← secondary, w-full h-12, mx-6, mt-3
│                              │
└─────────────────────────────┘

진입 조건:
  navigate('/signup/done', { replace: true }) 로만 진입
  → 뒤로가기 시 / 으로 이동 (history에 /signup 없음)

진입 시 처리:
  status가 아직 'MEMBER'가 아니면 setUser({ status: 'MEMBER' }) 처리
  (Step 5 [나중에] or /verify 완료 후 진입 모두 커버)
```

---

# 12. TermsBottomSheet

```
트리거: Step 4의 [보기] 버튼 클릭

레이어:
  Dim:  fixed inset-0 bg-black/40 z-70  (AuthBottomSheet Dim z-60보다 위)
  시트: fixed bottom-0 w-full z-80
        bg-white rounded-t-2xl
        h-[80vh]
        flex flex-col

헤더 (flex-shrink-0):
  flex items-center justify-between px-4 py-4 border-b
  약관 제목 (text-base font-bold)
  ✕ 버튼 (text-gray-400, 시트 닫기)

콘텐츠 (flex-1 overflow-y-auto):
  px-4 py-4
  text-sm text-gray-600 leading-relaxed
  mock 텍스트 (mockTerms.service / .privacy / .marketing)

하단 (flex-shrink-0):
  px-4 py-3 border-t
  [확인] primary w-full h-12 (닫기)
```

---

# 13. ProtectedRoute 구현

```ts
// router/MemberRoute.tsx
// 적용: /mypage
const MemberRoute = ({ children }: { children: ReactNode }) => {
  const { status } = useUserStore()
  if (status === 'GUEST') {
    return <Navigate to="/login" state={{ redirectTo: '/mypage' }} replace />
  }
  return <>{children}</>
}

// router/VerifiedRoute.tsx
// 적용: /write
const VerifiedRoute = ({ children }: { children: ReactNode }) => {
  const { status } = useUserStore()
  if (status === 'GUEST') {
    return <Navigate to="/login" state={{ redirectTo: '/write' }} replace />
  }
  if (status === 'MEMBER') {
    return <VerifyRequiredPage />  ← 섹션 7.4 참고
  }
  return <>{children}</>
}

// router/index.tsx 적용
<Route path="/mypage" element={<MemberRoute><MyPage /></MemberRoute>} />
<Route path="/write"  element={<VerifiedRoute><WritePage /></VerifiedRoute>} />
```

---

# 14. 권한별 UI 분기 — 페이지별

## 14.1 커뮤니티 메인 (`/`)

```
GUEST:
  GuestBanner 표시 (CategoryFilter 위, 스크롤 영역 최상단)
  PostList 정상 표시
  FAB 클릭 → AuthBottomSheet (GUEST)

MEMBER:
  GuestBanner 없음
  PostList 정상 표시
  FAB 클릭 → AuthBottomSheet (MEMBER)

VERIFIED:
  FAB 클릭 → /write 이동
```

## 14.2 게시글 상세 (`/post/:id`)

```
GUEST:
  PostContent · CommentList 정상 표시
  LikeButton: 회색 비활성 + 탭 → AuthBottomSheet (GUEST)
  CommentInput 자리 → LoginRequiredCommentInput
    "로그인 후 댓글을 작성할 수 있어요"

MEMBER:
  PostContent · CommentList 정상 표시
  LikeButton: 회색 비활성 + 탭 → AuthBottomSheet (MEMBER)
  CommentInput 자리 → LoginRequiredCommentInput
    "거주지 인증 후 댓글을 작성할 수 있어요"

VERIFIED:
  LikeButton 정상 토글
  CommentInput 정상 활성화
```

## 14.3 지도 페이지 (`/map`)

```
GUEST / MEMBER:
  MapView · ApartmentPanel 정상 표시 (조회 가능)
  ApartmentPanel [글쓰기] 탭 → AuthBottomSheet

VERIFIED:
  모든 기능 정상
```

## 14.4 실거래 탭

```
GUEST:
  조회 전체 정상
  [☆ 관심] 탭 → AuthBottomSheet (GUEST)

MEMBER:
  조회 전체 정상
  [☆ 관심] 정상 토글 (관심은 MEMBER도 가능)

VERIFIED:
  모든 기능 정상
```

## 14.5 Header 우측 아이콘

```
GUEST:    👤 → navigate('/login', { state: { redirectTo: '/' } })
MEMBER:   👤 → navigate('/mypage')
VERIFIED: 👤 → navigate('/mypage')
```

---

# 15. 마이페이지 (`/mypage`) — 상태별 UI

```
MEMBER (거주지 미인증):
  UserInfoCard:
    닉네임 (text-lg font-bold)
    "거주지 미인증" badge (bg-orange-50 text-orange-500 rounded-full px-2 py-0.5 text-xs)

  인증 유도 카드:
    bg-blue-50 rounded-xl p-4 mx-4 mt-3
    "🏠 거주지를 인증하면 글쓰기, 댓글이 가능해요" text-sm text-blue-700
    [지금 인증하기] bg-blue-500 text-white rounded-lg px-4 py-2 text-sm mt-3

  MyPostList / MyCommentList → 내용 있으면 표시, 없으면 EmptyState

VERIFIED:
  UserInfoCard:
    닉네임 (text-lg font-bold)
    "{아파트명} · 인증완료 ✓" (text-sm text-green-500)
  인증 유도 카드 없음
```

---

# 16. Toast 메시지

| 상황 | 메시지 | 타입 |
|------|--------|------|
| 로그인 성공 | "로그인 되었어요 👋" | success |
| 로그아웃 | "로그아웃 되었어요" | info |
| 회원가입 완료 | "{nickname}님, 환영해요! 🎉" | success |
| 거주지 인증 완료 | "{아파트명} 인증 완료! ✓" | success |
| 소셜 로그인 | "준비 중인 기능이에요" | info |
| 비밀번호 찾기 | "준비 중인 기능이에요" | info |

---

# 17. Mock 데이터 (`mockAuthData.ts`)

```ts
export const mockNicknames = [
  "익명_7823", "이웃_4521", "주민_9034",
  "입주민_3312", "동네_5678", "아파트_2290",
  "새벽_1122", "햇살_8877", "바람_3344",
]

export const mockUsedEmails = ["test@test.com", "used@example.com"]
export const mockUsedNicknames = ["익명_0000", "테스트유저"]

export const mockLoginUser = {
  userId: 1,
  nickname: "익명_7823",
  status: 'MEMBER' as const,
  apartmentId: null,
  apartmentName: null,
}

// 로그인 실패 트리거 (mock)
// 이 이메일 + 비밀번호 조합이면 실패 처리
export const mockWrongCredentials = {
  email: "wrong@test.com",
  password: "wrongpass",
}

export const mockTerms = {
  service: `제 1조 (목적)
이 약관은 동네톡(이하 "서비스")의 이용 조건 및 절차에 관한 사항을 규정합니다.

제 2조 (서비스 이용)
회원은 본 약관에 동의함으로써 서비스를 이용할 수 있습니다.`,

  privacy: `개인정보 처리방침
동네톡은 이용자의 개인정보를 소중히 여기며 관련 법령을 준수합니다.

수집 항목: 이메일, 닉네임, 거주 아파트 정보
수집 목적: 서비스 제공 및 본인 확인`,

  marketing: `마케팅 정보 수신 동의 (선택)
이벤트, 혜택, 신규 기능 안내 등의 마케팅 정보를 수신합니다.
동의하지 않아도 서비스 이용에 제한이 없습니다.`,
}
```

---

# 18. 컴포넌트 파일 구조

```
src/
├── components/
│   ├── common/
│   │   ├── AuthBottomSheet.tsx
│   │   ├── GuestBanner.tsx
│   │   └── LoginRequiredCommentInput.tsx
│   └── features/
│       ├── auth/
│       │   ├── ServiceLogo.tsx
│       │   ├── LoginForm.tsx
│       │   ├── EmailInput.tsx
│       │   ├── PasswordInput.tsx
│       │   ├── FormField.tsx            ← label + input + error 묶음
│       │   ├── ServerError.tsx          ← 로그인 실패 에러 표시
│       │   ├── SocialDivider.tsx        ← "또는" 구분선
│       │   ├── SocialLoginButtons.tsx
│       │   ├── ForgotPasswordLink.tsx
│       │   ├── SignupLink.tsx
│       │   ├── StepIndicator.tsx
│       │   ├── StepNavigation.tsx
│       │   ├── EmailStep.tsx
│       │   ├── PasswordStep.tsx
│       │   ├── NicknameStep.tsx
│       │   ├── TermsStep.tsx
│       │   ├── TermsBottomSheet.tsx
│       │   └── VerifyGuideStep.tsx
│       └── mypage/
│           └── UserInfoCard.tsx         ← 상태별 분기 추가
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── SignupDonePage.tsx
│   └── VerifyRequiredPage.tsx           ← [신규] VerifiedRoute용
├── router/
│   ├── MemberRoute.tsx
│   └── VerifiedRoute.tsx
└── data/
    └── mockAuthData.ts
```

---

# 19. padding 전체 정리

| 페이지 | padding-top | padding-bottom | 비고 |
|--------|-------------|----------------|------|
| /login | 56px | 24px | Header만 |
| /signup (step 1~4) | 56px | 80px | StepNavigation fixed |
| /signup (step 5) | 56px | 40px | StepNavigation hidden |
| /signup/done | 56px | 40px | Header만 |
| /mypage (MEMBER) | 56px | 96px | FAB 있음 |
| /mypage (VERIFIED) | 56px | 96px | FAB 있음 |

---

# 20. 화면 전환 흐름 전체

```
[비회원 진입]
  앱 실행 → GUEST → / + GuestBanner
  FAB 클릭 → AuthBottomSheet(GUEST)
    [로그인하기] → /login (state: redirectTo='/')
    [회원가입]   → /signup
    [둘러보기]   → 시트 닫기

[로그인]
  /login → 입력 → [로그인]
    성공 → MEMBER → navigate(redirectTo || '/', replace)  + Toast
    실패 → ServerError 표시

[회원가입]
  /signup
    Step1 → Step2 → Step3 → Step4 → Step5
    Step5 [지금 인증] → /verify → VERIFIED → /signup/done (replace)
    Step5 [나중에]    → MEMBER  → /signup/done (replace)
  /signup/done → [커뮤니티] → / | [거주지 인증] → /verify

[MEMBER 글쓰기 시도]
  FAB → AuthBottomSheet(MEMBER)
    [거주지 인증하기] → /verify → VERIFIED → navigate(-1) → / → FAB → /write

[직접 URL 접근]
  GUEST + /mypage → /login (state: redirectTo='/mypage')
  GUEST + /write  → /login (state: redirectTo='/write')
  MEMBER + /write → VerifyRequiredPage (AuthBottomSheet MEMBER 상태로 열림)
```

---

# 21. 최종 생성 요구사항

1. **사용자 유형 3단계** — `GUEST / MEMBER / VERIFIED`, userStore status 확장
2. **라우팅 3개 추가** — `/login`, `/signup`, `/signup/done`
3. **z-index 레이어** — 섹션 6 기준 엄수 (Dim z-60 / 시트 z-70 / FAB z-50 분리)
4. **AuthBottomSheet** — GUEST/MEMBER 문구 분기, 딤 애니메이션, 섹션 7.1 기준
5. **GuestBanner** — 스크롤 영역 내 CategoryFilter 위, sticky/fixed 아님
6. **LoginRequiredCommentInput** — z-40, CommentInput과 동일 높이
7. **VerifyRequiredPage** — VerifiedRoute에서 MEMBER 접근 시 렌더링, 섹션 7.4 기준
8. **redirectTo 패턴** — 섹션 8 기준, 로그인 후 navigate(redirectTo, replace)
9. **로그인 페이지** — 유효성 onBlur 검사, ServerError 분리, 소셜 mock
10. **회원가입 5단계** — StepIndicator sticky, Step 5에서 StepNavigation hidden
11. **TermsBottomSheet** — z-80, 섹션 12 기준
12. **ProtectedRoute 2종** — MemberRoute / VerifiedRoute, 섹션 13 구현
13. **권한별 UI 분기** — 섹션 14 기준 전 페이지 적용
14. **Mock 데이터** — `mockAuthData.ts` 섹션 17 기준
15. **모바일 우선** — max-width 768px
