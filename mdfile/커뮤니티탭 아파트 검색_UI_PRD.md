# 📄 아파트 검색 & 지도 선택 팝업 PRD
## v3.0 | 검증 완료 | Spring + React 구현용

> **범위**: LeftSidebar 상단 검색 트리거 + ApartmentSelectModal UI
> **연관 PRD**: UI Frame v4 / 커뮤니티 사이드바 v3 / 인증 PRD v2
>
> **v3 검증 변경 요약**:
> - Modal 높이 클래스 순서 버그 → `h-[90vh] lg:h-[80vh]` 모바일 우선으로 수정
> - `useUserStore.getState()` 이벤트 핸들러 사용 정당성 명시, aptId 타입 불일치 변환 추가
> - `isMobile` 판단 방법 미명세 → Tailwind 클래스 방식으로 확정 (JS 분기 제거)
> - `aptId` 타입 불일치 (string vs number) → Number() 변환 명세 추가
> - `useThrottle` 의존성 배열 버그 → fn을 useRef로 감싸는 방식으로 수정
> - SearchSection 상태 위치 불명확 → SearchSection 내부 로컬 state로 확정
> - Modal Portal 미명세 → `createPortal(document.body)` 필수 명세 추가
> - ESC 키 닫기 미명세 → useEffect 이벤트 리스너 추가
> - 스크롤 잠금 미명세 → Modal 열릴 때 body overflow-hidden 처리 추가

---

# 1. 개요

## 목적

사용자가 아파트를 검색하거나 지도에서 선택하여 해당 아파트 커뮤니티로 진입하는 핵심 시스템.

- 커뮤니티 Entry Point
- 아파트 기반 커뮤니티 구조 형성
- 검색 + 지도 기반 탐색 UX 제공

## 위치

**커뮤니티 탭(`/`) LeftSidebar 최상단** — ApartmentInfoCard 바로 위.

```
기존 LeftSidebar 컴포넌트 트리 수정:

<LeftSidebar>
  <ApartmentSearchTrigger />   ← 신규 추가 (최상단)
  <ApartmentInfoCard />
  <TrendingKeywords />
</LeftSidebar>
```

---

# 2. 기술 스택

| 항목 | 버전 | 용도 |
|------|------|------|
| React | 18+ | UI |
| TypeScript | 5+ | 타입 |
| Tailwind CSS | 3+ | 스타일 |
| Zustand | 4+ | 전역 상태 (aptId) |
| React Router v6 | — | 페이지 이동 |
| Spring Boot | 3+ | 검색 / 지도 API |
| KakaoMap JS SDK | — | 지도 탭 (mock 대체 가능) |

---

# 3. 전체 흐름

```
[SearchTrigger 클릭 (데스크탑: LeftSidebar / 모바일: CommunityPage 상단)]
  ↓
[ApartmentSelectModal OPEN — createPortal(document.body)]
  ↓
  ├── [검색 탭] 키워드 입력 → debounce 300ms → API / mock 호출 → 결과 표시
  │                                   ↓ 클릭
  └── [지도 탭] 지도 이동 → throttle 500ms → 마커 로드
                                   ↓ 마커 클릭
                    ↓
        handleSelect(apt) 호출
                    ↓
        userStore.setUser({ apartmentId: Number(apt.aptId), apartmentName })
                    ↓
        saveRecentApartment(apt)   ← localStorage
                    ↓
        onClose() + Toast
                    ↓
        LeftSidebar 자동 갱신 (userStore 구독)
        (페이지 이동 없음 — 현재 / 유지)
```

---

# 4. Modal Portal — 필수

> ⚠️ **[수정 핵심]** Modal이 `ApartmentSearchTrigger` 내부에 렌더링되면
> `aside`의 `sticky`, `overflow-hidden`, `h-fit` 컨텍스트에 갇혀
> z-index가 무력화되거나 화면 밖으로 잘려나감.
> **반드시 `createPortal(document.body)`로 DOM 최상위에 렌더링**.

```tsx
// ApartmentSelectModal.tsx
import { createPortal } from 'react-dom'

export const ApartmentSelectModal = ({ onClose }: { onClose: () => void }) => {
  // ESC 키 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <>
      {/* Dim */}
      <div
        className="fixed inset-0 bg-black/50 z-[90]"
        onClick={onClose}
      />
      {/* Modal 본체 */}
      <div className="fixed inset-0 flex items-center justify-center z-[90] p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl
                     w-full h-[90vh] lg:h-[80vh] lg:max-w-[720px]
                     flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <ModalContent onClose={onClose} />
        </div>
      </div>
    </>,
    document.body
  )
}
```

> ⚠️ **[수정]** v2의 `h-[80vh] lg:h-[80vh] h-[90vh]` 클래스 순서 버그.
> Tailwind는 나중에 선언된 클래스가 이기지 않음 — 동일 속성 클래스 중 마지막이 적용됨.
> 모바일 우선으로 `h-[90vh] lg:h-[80vh]`로 수정.

---

# 5. z-index 레이어

```
z-[90]  ApartmentSelectModal Dim + 본체   ← 신규, 최상위
z-80    TermsBottomSheet
z-70    AuthBottomSheet 시트
z-60    AuthBottomSheet Dim
z-50    FAB
z-40    CommentInput / LoginRequiredCommentInput
z-30    Header
z-20    TabBar
z-10    ApartmentPanel
z-0     MainContent
```

> Tailwind 기본 z-index 스케일(z-0~z-50)을 벗어나므로 `z-[90]` 임의값 사용.

---

# 6. 트리거 컴포넌트

## 6.1 데스크탑 — ApartmentSearchTrigger (LeftSidebar 최상단)

```
┌──────────────────────────┐
│  🔍 잠실엘스              │  ← 선택된 아파트명 표시
│  (또는) 아파트명 또는 지역 검색 │  ← 미선택 시
└──────────────────────────┘
```

```tsx
// components/features/apartment-select/ApartmentSearchTrigger.tsx

export const ApartmentSearchTrigger = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { apartmentName } = useUserStore()   // 기존 필드 사용

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center gap-2 mb-4
                   bg-white border border-gray-200 rounded-xl
                   px-4 py-3 text-left cursor-pointer
                   hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <span className="text-gray-400 text-sm flex-shrink-0">🔍</span>
        <span className="text-sm text-gray-600 truncate">
          {apartmentName ?? '아파트명 또는 지역 검색'}
        </span>
      </button>

      {/* Portal로 렌더링 — aside 컨텍스트 탈출 */}
      {isModalOpen && (
        <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
```

## 6.2 모바일 — MobileApartmentTrigger

> ⚠️ **[수정]** v2의 `{isMobile && ...}` JS 분기는 `window.innerWidth` 체크가 필요해 SSR 이슈 가능.
> **Tailwind CSS 클래스 방식**으로 대체. 항상 렌더링하되 lg 이상에서 숨김.

```tsx
// components/features/apartment-select/MobileApartmentTrigger.tsx

export const MobileApartmentTrigger = ({ onClick }: { onClick: () => void }) => {
  const { apartmentName } = useUserStore()

  return (
    // lg 이상: hidden (LeftSidebar 트리거 사용)
    // lg 미만: 표시
    <button
      onClick={onClick}
      className="lg:hidden w-full flex items-center gap-2
                 mx-0 mb-3
                 bg-white border border-gray-200 rounded-xl
                 px-4 py-2.5 text-left cursor-pointer
                 hover:border-blue-400 transition-colors"
    >
      <span className="text-gray-400 text-sm">🔍</span>
      <span className="text-sm text-gray-400 truncate">
        {apartmentName ?? '아파트명 또는 지역 검색'}
      </span>
    </button>
  )
}
```

```tsx
// CommunityPage.tsx — CategoryFilter 위에 배치
<CommunityPage>
  <MobileApartmentTrigger onClick={() => setIsModalOpen(true)} />
  <CategoryFilter />
  <SortDropdown />
  <PostList />

  {isModalOpen && (
    <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />
  )}
</CommunityPage>
```

---

# 7. Modal 내부 구조

## 7.1 레이아웃

```
┌─────────────────────────────────────────┐  ← flex-col, h-full
│  아파트 선택                    ✕        │  ← ModalHeader (flex-shrink-0)
├─────────────────────────────────────────┤
│  [검색]              [지도]              │  ← TabSwitcher (flex-shrink-0)
├─────────────────────────────────────────┤
│                                         │
│  [SearchSection 또는 MapSection]        │  ← flex-1, overflow-hidden
│                                         │
└─────────────────────────────────────────┘
```

## 7.2 ModalContent 컴포넌트 트리

```tsx
// ModalHeader, TabSwitcher는 flex-shrink-0 (높이 고정)
// 탭 콘텐츠 영역은 flex-1 overflow-hidden

const ModalContent = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'검색' | '지도'>('검색')

  const handleSelect = (apt: Apartment) => {
    // 이벤트 핸들러 내부: .getState() 사용 허용
    // (React 렌더링 사이클 외부이므로 훅 규칙 위반 아님)
    useUserStore.getState().setUser({
      apartmentId:   Number(apt.aptId),  // ⚠️ string → number 변환
      apartmentName: apt.aptName,
    })
    saveRecentApartment(apt)
    onClose()
    showToast(`${apt.aptName} 커뮤니티로 이동했어요`, 'success')
  }

  return (
    <div className="flex flex-col h-full">
      <ModalHeader title="아파트 선택" onClose={onClose} />
      <TabSwitcher
        tabs={['검색', '지도']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <div className="flex-1 overflow-hidden">
        {activeTab === '검색' && <SearchSection onSelect={handleSelect} />}
        {activeTab === '지도' && <MapSection    onSelect={handleSelect} />}
      </div>
    </div>
  )
}
```

## 7.3 aptId 타입 변환

> ⚠️ **[수정]** `userStore.apartmentId`는 `number | null` 타입.
> `Apartment.aptId`는 `string` 타입 ("APT001").
> `Number(apt.aptId)` 변환 시 NaN 방어 필요.

```ts
// aptId 변환 유틸
const toApartmentId = (aptId: string): number => {
  // "APT001" 형태 → NaN 방지
  // 실제 API에서 숫자형 ID를 반환하면 Number() 직접 사용 가능
  // mock 단계: aptId를 index로 처리
  const parsed = Number(aptId.replace(/[^0-9]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

// 사용
useUserStore.getState().setUser({
  apartmentId:   toApartmentId(apt.aptId),
  apartmentName: apt.aptName,
})
```

> 실제 Spring API 연동 시 `aptId`를 숫자형으로 받으면 변환 불필요.
> API 응답 타입 확정 후 `Apartment.aptId: number`로 변경 검토.

---

# 8. 상태 관리 확정

## 8.1 Modal 상태 위치

| 상태 | 위치 | 이유 |
|------|------|------|
| `isModalOpen` | 트리거 컴포넌트 로컬 | 트리거마다 독립 |
| `activeTab` | ModalContent 로컬 | Modal 닫히면 초기화 |
| `keyword` | SearchSection 로컬 | 검색 탭 전용 |
| `results` | SearchSection 로컬 | 검색 탭 전용 |
| `mapBounds` | MapSection 로컬 | 지도 탭 전용 |
| `apartmentId` / `apartmentName` | userStore 전역 | 선택 완료 후 앱 전체 사용 |

## 8.2 전역 userStore 연동

```ts
// 선택 완료 → userStore 업데이트
// → LeftSidebar(ApartmentInfoCard, TrendingKeywords), PostList 자동 갱신
// → 페이지 이동 없음

// userStore에서 읽는 컴포넌트들:
// - ApartmentSearchTrigger: apartmentName 표시
// - MobileApartmentTrigger: apartmentName 표시
// - ApartmentInfoCard: aptId로 지역 정보 조회
// - TrendingKeywords: aptId로 키워드 조회
// - PostList: aptId로 게시글 필터링 (향후)
```

---

# 9. SearchSection

## 9.1 SearchSection 내부 상태

> ⚠️ **[확정]** v2에서 `keyword`, `results`가 어느 컴포넌트 소유인지 불명확했음.
> **SearchSection 내부 로컬 state**로 확정.

```tsx
export const SearchSection = ({ onSelect }: { onSelect: (apt: Apartment) => void }) => {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Apartment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError]     = useState(false)

  const debouncedKeyword = useDebounce(keyword, 300)

  useEffect(() => {
    if (debouncedKeyword.length < 2) {
      setResults([])
      setIsError(false)
      return
    }
    fetchSearch(debouncedKeyword)
  }, [debouncedKeyword])

  const fetchSearch = async (kw: string) => {
    setIsLoading(true)
    setIsError(false)
    try {
      if (USE_MOCK_SEARCH) {
        await new Promise(r => setTimeout(r, 200))   // mock 딜레이
        setResults(searchApartmentsMock(kw))
      } else {
        const res  = await fetch(`/api/apartments/search?keyword=${kw}`)
        const data = await res.json()
        if (data.success) setResults(data.data)
        else throw new Error(data.error?.message)
      }
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SearchInput
        value={keyword}
        onChange={setKeyword}
        onClear={() => setKeyword('')}
      />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}
```

## 9.2 검색 상태별 렌더링

```tsx
const renderContent = () => {
  // 검색 전
  if (keyword.length === 0) return (
    <>
      <RecentApartmentList onSelect={onSelect} />
      <PopularApartmentList onSelect={onSelect} />
    </>
  )

  // 2글자 미만
  if (keyword.length < 2) return (
    <p className="text-xs text-gray-400 text-center py-8">
      2글자 이상 입력해주세요
    </p>
  )

  // 로딩
  if (isLoading) return <SearchResultSkeleton />

  // API 에러
  if (isError) return (
    <p className="text-xs text-red-400 text-center py-8">
      잠시 후 다시 시도해주세요
    </p>
  )

  // 결과 없음
  if (results.length === 0) return (
    <EmptyState icon="🔍" title="검색 결과가 없습니다" />
  )

  // 결과 있음
  return <SearchResultList results={results} onSelect={onSelect} />
}
```

## 9.3 SearchInput

```tsx
export const SearchInput = ({
  value,
  onChange,
  onClear,
}: {
  value: string
  onChange: (v: string) => void
  onClear: () => void
}) => (
  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
    <span className="text-gray-400 text-sm flex-shrink-0">🔍</span>
    <input
      type="text"
      autoFocus
      autoComplete="off"
      placeholder="아파트명 또는 지역으로 검색"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
    />
    {value && (
      <button onClick={onClear} className="text-gray-400 text-sm flex-shrink-0">
        ✕
      </button>
    )}
  </div>
)
```

## 9.4 SearchResultItem

```tsx
const SearchResultItem = ({
  apt,
  onSelect,
}: {
  apt: Apartment
  onSelect: (apt: Apartment) => void
}) => (
  <div
    onClick={() => onSelect(apt)}
    className="flex items-center justify-between
               px-4 py-3 border-b border-gray-100 last:border-b-0
               cursor-pointer hover:bg-gray-50 transition-colors"
  >
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate">{apt.aptName}</p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{apt.address}</p>
    </div>
    <span className="text-gray-300 text-sm flex-shrink-0 ml-2">›</span>
  </div>
)
```

## 9.5 RecentApartmentList

```tsx
export const RecentApartmentList = ({
  onSelect,
}: {
  onSelect: (apt: Apartment) => void
}) => {
  const [recents, setRecents] = useState<Apartment[]>([])

  useEffect(() => {
    setRecents(getRecentApartments())
  }, [])

  if (recents.length === 0) return null   // 최근 선택 없으면 섹션 숨김

  return (
    <div className="py-3">
      <div className="flex items-center justify-between px-4 mb-1">
        <span className="text-xs font-medium text-gray-500">최근 선택</span>
        <button
          onClick={() => {
            clearRecentApartments()
            setRecents([])
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          전체삭제
        </button>
      </div>
      {recents.map(apt => (
        <SearchResultItem key={apt.aptId} apt={apt} onSelect={onSelect} />
      ))}
    </div>
  )
}
```

## 9.6 PopularApartmentList

```tsx
export const PopularApartmentList = ({
  onSelect,
}: {
  onSelect: (apt: Apartment) => void
}) => {
  // mock 또는 API
  const data = USE_MOCK_SEARCH ? mockPopularApartments : usePopularApartments()

  if (!data || data.length === 0) return null

  return (
    <div className="py-3">
      <p className="text-xs font-medium text-gray-500 px-4 mb-1">인기 아파트</p>
      {data.map((apt, i) => (
        <div
          key={apt.aptId}
          onClick={() => onSelect(apt)}
          className="flex items-center gap-3 px-4 py-3
                     border-b border-gray-100 last:border-b-0
                     cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <span className={`w-5 text-xs font-bold flex-shrink-0 text-center
            ${i < 3 ? 'text-blue-500' : 'text-gray-400'}`}>
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{apt.aptName}</p>
            <p className="text-xs text-gray-400 truncate">{apt.address}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

# 10. useDebounce / useThrottle

## 10.1 useDebounce

```ts
// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
```

## 10.2 useThrottle

> ⚠️ **[수정]** v2의 `useThrottle`은 `fn`을 `useCallback` 의존성에 넣었는데
> `fn`이 매 렌더마다 새로 생성되면 throttle이 매번 리셋됨.
> **`fn`을 `useRef`로 감싸서** 항상 최신 함수를 참조하되 throttle은 리셋되지 않게 수정.

```ts
// hooks/useThrottle.ts
import { useRef, useCallback } from 'react'

export function useThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  const lastCall  = useRef(0)
  const fnRef     = useRef(fn)

  // 항상 최신 fn 참조 유지
  fnRef.current = fn

  return useCallback((...args: unknown[]) => {
    const now = Date.now()
    if (now - lastCall.current >= delay) {
      lastCall.current = now
      fnRef.current(...args)
    }
  }, [delay]) as T   // delay만 의존성 — fn 변경으로 throttle 리셋 방지
}
```

---

# 11. MapSection

## 11.1 USE_KAKAO_MAP 플래그

```ts
// config/featureFlags.ts (또는 .env 변수)
export const USE_KAKAO_MAP = false   // SDK 연동 전까지 false
```

## 11.2 분기 처리

```tsx
export const MapSection = ({ onSelect }: { onSelect: (apt: Apartment) => void }) => {
  if (!USE_KAKAO_MAP) return <MockMapView onSelect={onSelect} />
  return <KakaoMapView onSelect={onSelect} />
}
```

## 11.3 MockMapView

```tsx
const MockMapView = ({ onSelect }: { onSelect: (apt: Apartment) => void }) => (
  <div className="flex-1 h-full bg-gray-100 relative">
    {/* 지도 플레이스홀더 */}
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-sm text-gray-400">지도 영역 (KakaoMap SDK 연동 예정)</p>
    </div>

    {/* mock 마커 */}
    {mockPopularApartments.map((apt, i) => (
      <button
        key={apt.aptId}
        onClick={() => onSelect(apt)}
        className="absolute bg-blue-500 text-white text-xs
                   rounded-full px-2 py-1 shadow-md
                   hover:bg-blue-600 transition-colors"
        style={{
          top:  `${15 + i * 14}%`,
          left: `${15 + i * 13}%`,
        }}
      >
        📍 {apt.aptName}
      </button>
    ))}
  </div>
)
```

## 11.4 KakaoMapView (SDK 연동 시)

```tsx
const KakaoMapView = ({ onSelect }: { onSelect: (apt: Apartment) => void }) => {
  const mapRef     = useRef<HTMLDivElement>(null)
  const mapObjRef  = useRef<kakao.maps.Map | null>(null)
  const [markers, setMarkers] = useState<Apartment[]>([])

  const fetchMarkers = useThrottle(async () => {
    if (!mapObjRef.current) return
    const center = mapObjRef.current.getCenter()
    const level  = mapObjRef.current.getLevel()
    try {
      const res  = await fetch(
        `/api/apartments/map?lat=${center.getLat()}&lng=${center.getLng()}&level=${level}`
      )
      const data = await res.json()
      if (data.success) setMarkers(data.data)
    } catch {
      // 마커 로드 실패 시 기존 마커 유지
    }
  }, 500)

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return

    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.511, 127.087),
      level: 5,
    })
    mapObjRef.current = map
    kakao.maps.event.addListener(map, 'idle', fetchMarkers)
    fetchMarkers()
  }, [])

  return <div ref={mapRef} className="w-full h-full" />
}
```

---

# 12. 공통 타입

```ts
// types/apartment.ts

export type Apartment = {
  aptId:   string   // API 연동 확정 전 string 유지 → 연동 후 number로 변경 검토
  aptName: string
  address: string
  lat:     number
  lng:     number
}
```

---

# 13. Mock 데이터 및 유틸

## 13.1 mockApartmentData.ts

```ts
// data/mockApartmentData.ts

export const mockSearchResults: Apartment[] = [
  { aptId: 'APT001', aptName: '잠실엘스',       address: '서울 송파구 잠실동', lat: 37.511, lng: 127.087 },
  { aptId: 'APT002', aptName: '잠실 리센츠',     address: '서울 송파구 잠실동', lat: 37.512, lng: 127.088 },
  { aptId: 'APT003', aptName: '잠실 트리지움',   address: '서울 송파구 잠실동', lat: 37.513, lng: 127.089 },
  { aptId: 'APT004', aptName: '잠실 파크리오',   address: '서울 송파구 신천동', lat: 37.514, lng: 127.090 },
  { aptId: 'APT005', aptName: '잠실 레이크팰리스', address: '서울 송파구 잠실동', lat: 37.515, lng: 127.091 },
]

export const mockPopularApartments: Apartment[] = [
  { aptId: 'APT001', aptName: '잠실엘스',          address: '서울 송파구 잠실동', lat: 37.511, lng: 127.087 },
  { aptId: 'APT006', aptName: '헬리오시티',         address: '서울 송파구 가락동', lat: 37.498, lng: 127.121 },
  { aptId: 'APT007', aptName: '래미안퍼스티지',     address: '서울 서초구 반포동', lat: 37.505, lng: 126.998 },
  { aptId: 'APT008', aptName: '아크로리버파크',     address: '서울 서초구 반포동', lat: 37.506, lng: 126.997 },
  { aptId: 'APT009', aptName: '마포래미안푸르지오', address: '서울 마포구 아현동', lat: 37.549, lng: 126.954 },
]

export const USE_MOCK_SEARCH = true   // API 연동 전까지 true

export const searchApartmentsMock = (keyword: string): Apartment[] => {
  const all = [...mockSearchResults, ...mockPopularApartments]
  const unique = all.filter((apt, i, arr) =>
    arr.findIndex(a => a.aptId === apt.aptId) === i
  )
  return unique.filter(
    apt => apt.aptName.includes(keyword) || apt.address.includes(keyword)
  )
}
```

## 13.2 recentApartments.ts

```ts
// utils/recentApartments.ts

const KEY = 'recentApartments'
const MAX = 5

export const saveRecentApartment = (apt: Apartment): void => {
  try {
    const existing: Apartment[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    const filtered = existing.filter(a => a.aptId !== apt.aptId)   // 중복 제거
    const updated  = [apt, ...filtered].slice(0, MAX)               // 최신 순, 최대 5개
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

export const getRecentApartments = (): Apartment[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export const clearRecentApartments = (): void => {
  localStorage.removeItem(KEY)
}
```

---

# 14. API 명세 (Spring 연동 기준)

## 14.1 아파트 검색

```
GET /api/apartments/search?keyword={keyword}

Params:  keyword (string, min 2자)

Response 200:
{
  "success": true,
  "data": [
    { "aptId": "APT123", "aptName": "잠실엘스", "address": "서울 송파구 잠실동", "lat": 37.51, "lng": 127.10 }
  ],
  "error": null
}

Error:
{
  "success": false,
  "data": null,
  "error": { "code": "APT_SEARCH_FAIL", "message": "검색 중 오류 발생" }
}
```

## 14.2 지도 기반 아파트 조회

```
GET /api/apartments/map?lat={lat}&lng={lng}&level={level}

Params:
  lat   (number) — 지도 중심 위도
  lng   (number) — 지도 중심 경도
  level (number) — 줌 레벨

Response 200:
{
  "success": true,
  "data": [ { "aptId": "APT123", "aptName": "잠실엘스", "lat": 37.51, "lng": 127.10 } ]
}
```

## 14.3 인기 아파트 조회

```
GET /api/apartments/popular

Response 200:
{
  "success": true,
  "data": Apartment[]   // 상위 5개
}
```

---

# 15. 에러 / 빈 상태

| 상황 | UI |
|------|-----|
| 검색 결과 없음 | `<EmptyState icon="🔍" title="검색 결과가 없습니다" />` |
| 2글자 미만 입력 | "2글자 이상 입력해주세요" text-xs text-gray-400 text-center py-8 |
| 검색 API 실패 | "잠시 후 다시 시도해주세요" text-xs text-red-400 text-center py-8 |
| 최근 선택 없음 | RecentApartmentList `return null` |
| 인기 아파트 실패 | PopularApartmentList `return null` |
| 지도 마커 없음 | "이 지역에 아파트 정보가 없습니다" (지도 위 absolute overlay) |

---

# 16. 성능 최적화

| 기능 | 구현 | 수치 |
|------|------|------|
| 검색 | `useDebounce` | 300ms |
| 지도 | `useThrottle` (fnRef 패턴) | 500ms |
| 마커 | MarkerClusterer | KakaoMap SDK 연동 시 |
| 인기 아파트 | React Query staleTime | 10분 |
| 최근 선택 | localStorage | API 불필요 |

---

# 17. 컴포넌트 파일 구조

```
src/
├── components/
│   ├── features/
│   │   └── apartment-select/
│   │       ├── ApartmentSearchTrigger.tsx   ← LeftSidebar 최상단
│   │       ├── MobileApartmentTrigger.tsx   ← lg:hidden, CommunityPage 상단
│   │       ├── ApartmentSelectModal.tsx     ← createPortal(document.body)
│   │       ├── ModalContent.tsx             ← Modal 내부 구조 (탭 + 콘텐츠)
│   │       ├── ModalHeader.tsx
│   │       ├── TabSwitcher.tsx
│   │       ├── SearchSection.tsx            ← keyword/results 로컬 state 소유
│   │       ├── SearchInput.tsx
│   │       ├── SearchResultList.tsx
│   │       ├── SearchResultItem.tsx
│   │       ├── RecentApartmentList.tsx
│   │       ├── PopularApartmentList.tsx
│   │       ├── SearchResultSkeleton.tsx
│   │       ├── MapSection.tsx               ← USE_KAKAO_MAP 분기
│   │       ├── KakaoMapView.tsx             ← SDK 연동 시
│   │       └── MockMapView.tsx              ← mock 단계
│   └── layout/
│       └── LeftSidebar.tsx                  ← ApartmentSearchTrigger 추가
├── hooks/
│   ├── useDebounce.ts                       ← 신규
│   └── useThrottle.ts                       ← 신규 (fnRef 패턴)
├── utils/
│   └── recentApartments.ts                  ← save/get/clear 유틸
├── data/
│   └── mockApartmentData.ts                 ← USE_MOCK_SEARCH 플래그 포함
└── types/
    └── apartment.ts                         ← Apartment 공통 타입
```

---

# 18. 디자인 토큰

```
Modal Dim:              fixed inset-0 bg-black/50 z-[90]
Modal 본체:             bg-white rounded-2xl shadow-2xl overflow-hidden
                        w-full h-[90vh] lg:max-w-[720px] lg:h-[80vh]

SearchTrigger (사이드):  bg-white border border-gray-200 rounded-xl px-4 py-3
                        hover:border-blue-400 hover:bg-blue-50
SearchTrigger (모바일):  동일 스타일, lg:hidden
SearchInput (Modal):    border-b border-gray-200 px-4 py-3 text-sm
SearchResultItem:       px-4 py-3 border-b border-gray-100 hover:bg-gray-50
인기 아파트 순위 1~3위:  text-xs text-blue-500 font-bold
인기 아파트 순위 4~5위:  text-xs text-gray-400
```

---

# 19. 최종 생성 요구사항

1. **createPortal** — `ApartmentSelectModal`은 반드시 `createPortal(document.body)` 사용
2. **ESC 키 닫기** — `useEffect` + `keydown` 이벤트 리스너
3. **body 스크롤 잠금** — Modal 열릴 때 `document.body.style.overflow = 'hidden'`, 닫힐 때 복원
4. **Modal 높이** — `h-[90vh] lg:h-[80vh]` (모바일 우선 순서 준수)
5. **z-[90]** — Tailwind 임의값 사용, Dim + 본체 동일 레이어
6. **ApartmentSearchTrigger** — LeftSidebar 최상단, apartmentName 표시
7. **MobileApartmentTrigger** — `lg:hidden`, CommunityPage CategoryFilter 위
8. **isMobile JS 분기 금지** — Tailwind 클래스(lg:hidden / hidden lg:block)로만 처리
9. **SearchSection 상태 소유** — keyword / results / isLoading / isError 모두 SearchSection 로컬
10. **aptId 타입 변환** — `toApartmentId()` 유틸 사용, NaN 방어
11. **useThrottle fnRef 패턴** — delay만 의존성, fn 변경으로 throttle 리셋 방지
12. **handleSelect** — `useUserStore.getState()` (이벤트 핸들러 내부), saveRecentApartment, onClose, Toast 순서
13. **USE_KAKAO_MAP 플래그** — false 시 MockMapView, `featureFlags.ts` 또는 상수 파일 분리
14. **USE_MOCK_SEARCH 플래그** — `mockApartmentData.ts`에 위치, true 시 `searchApartmentsMock()` 호출
15. **searchApartmentsMock 중복 제거** — aptId 기준 dedupe 처리
16. **recentApartments** — try-catch 감싸기, KEY 상수 분리
17. **Spring API** — 섹션 14 endpoint 기준, mock에서 API 전환 시 `USE_MOCK_SEARCH = false`로만 변경
