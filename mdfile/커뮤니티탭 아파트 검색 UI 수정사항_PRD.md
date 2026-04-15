# 📄 커뮤니티 아파트 컨텍스트 전환 PRD
## v3.0 | 검증 완료 | React 구현용

> **범위**: 아파트 선택 시 커뮤니티 피드 + 사이드바 전체 전환
> **연관 PRD**: 아파트 검색 팝업 v3 / 커뮤니티 사이드바 v3 / 인증 PRD v2 / 광고 시스템 v3
>
> **v3 검증 변경 요약**:
> - `resetCommunityFilters` 최초 마운트 시에도 실행되는 버그 → `useRef`로 이전값 추적, 변경 시에만 실행
> - `useEffect` + `queryKey` 이중 갱신으로 API 2회 호출 → queryKey에서 필터 제거하거나 초기화 순서 조정
> - `persist`에서 `status` 제외 시 새로고침 후 GUEST+아파트 모순 → persist 범위 재설계
> - `GuestBanner`와 `AptSelectPromptBanner` 동시 표시 우선순위 미명세 → 조건 분기 확정
> - 사이드바 aptId 타입 불일치 (`number` vs `string`) → `String()` 변환 위치 명세
> - `USE_MOCK_POSTS` 플래그 미명세 → `featureFlags.ts` 추가 명세
> - `fetchPostsMock` aptId 필터링 미동작 → 실제 필터링 로직 추가
> - `resetCommunityFilters` 위치 불명확 → uiStore 내부 액션으로 확정

---

# 1. 개요

## 목적

사용자가 아파트 검색 팝업에서 아파트를 선택하면
해당 아파트 기준으로 커뮤니티 피드 + 사이드바 전체가 전환된다.

## 핵심 설계 원칙

**`userStore.apartmentId`가 Single Source of Truth.**
라우팅 변경 없음. URL 쿼리 파라미터 사용 안 함.

```
아파트 선택 → userStore.apartmentId 변경
           → 이를 구독하는 모든 컴포넌트 자동 갱신
```

---

# 2. 기존 PRD와 연관 관계

| PRD | 아파트 ID 참조 | 영향 |
|-----|-------------|------|
| 커뮤니티 사이드바 v3 | `userStore.apartmentId` → `String()` 변환 후 prop | ✅ 자동 갱신 |
| 광고 시스템 v3 | `userStore.apartmentId` → `String()` 변환 후 사용 | ✅ 자동 갱신 |
| 아파트 검색 팝업 v3 | `userStore.setUser({ apartmentId: Number(aptId) })` | ✅ 변경 주체 |
| 실거래 사이드바 v3 | `tradeFilterStore` 독립 | ✅ 영향 없음 |
| 지도 필터 마커 v3 | `mapFilterStore` 독립 | ✅ 영향 없음 |
| 인증 PRD v2 | `userStore.apartmentId` = 인증된 아파트 | ⚠️ 섹션 3.2 참고 |

---

# 3. aptId 상태 설계

## 3.1 userStore — 기존 구조 재사용 (변경 없음)

```ts
type UserState = {
  userId:        number | null
  nickname:      string | null
  status:        'GUEST' | 'MEMBER' | 'VERIFIED'
  apartmentId:   number | null   // SSOT — 커뮤니티 기준 아파트 ID
  apartmentName: string | null

  setUser: (user: Partial<Omit<UserState, 'setUser' | 'logout'>>) => void
  logout:  () => void
}
```

## 3.2 인증 아파트 vs 탐색 아파트

```
MVP 정책:
  apartmentId 단일 필드 사용.
  탐색 목적으로 다른 아파트를 선택하면 apartmentId 덮어씀.
  글쓰기·댓글 권한은 여전히 status === 'VERIFIED' 기준 (아파트 무관).

주의:
  VERIFIED 사용자가 탐색 아파트를 선택하면 apartmentId가 변경됨.
  단, 글쓰기 시 아파트 표기는 현재 apartmentName 기준.
  (추후 "인증 아파트" vs "탐색 아파트" 분리가 필요하면 별도 PRD)
```

## 3.3 aptId 타입 변환 위치 확정

> ⚠️ **[수정]** userStore의 `apartmentId`는 `number | null`.
> 사이드바 컴포넌트들은 `aptId: string`을 받는 구조.
> **변환은 AppLayout에서 1회만** 처리.

```tsx
// AppLayout.tsx
const { apartmentId } = useUserStore()
const aptIdStr = apartmentId != null ? String(apartmentId) : 'apt-001'   // fallback mock

// aside 렌더링 시
<LeftSidebar  aptId={aptIdStr} />
<RightSidebar aptId={aptIdStr} />
```

---

# 4. userStore Persist 설계

> ⚠️ **[수정]** v2에서 `persist`에 `apartmentId`, `apartmentName`만 포함하고
> `status`는 제외했는데, 새로고침 후 `status = 'GUEST'` + `apartmentId = 123` 상태가 되어
> GUEST인데 아파트가 선택된 모순 발생.
>
> 해결: `status`도 함께 persist. 단, `userId`와 `nickname`은 서버 세션 기반이므로 제외.

```ts
// stores/userStore.ts
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist<UserState>(
    (set) => ({
      ...initialState,
      setUser: (user) => set((state) => ({ ...state, ...user })),
      logout:  () => set({ ...initialState }),
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        // ✅ persist 대상: 아파트 선택 + 인증 상태
        status:        state.status,
        apartmentId:   state.apartmentId,
        apartmentName: state.apartmentName,
        // ❌ 제외: userId, nickname (세션 기반, 재로그인 필요)
      }),
    }
  )
)
```

> 새로고침 후:
> - `status = 'VERIFIED'` + `apartmentId = 123` → 정상 복원
> - `status = 'MEMBER'` + `apartmentId = 123` → 아파트 탐색은 가능, 글쓰기 제한
> - `status = 'GUEST'` + `apartmentId = null` → 초기 상태

---

# 5. uiStore — resetCommunityFilters 추가

> ⚠️ **[확정]** uiStore 내부 액션으로 정의. 외부 유틸 함수 아님.

```ts
// stores/uiStore.ts (기존에 추가)

type UIState = {
  selectedCategory: string
  sortType: 'latest' | 'popular'
  searchKeyword: string | null
  tradePeriod: '1d' | '1w' | '1m'
  // ...기존 필드...

  setCategory:           (c: string) => void
  setSortType:           (s: 'latest' | 'popular') => void
  setSearchKeyword:      (kw: string | null) => void
  resetCommunityFilters: () => void   // ← 신규 추가
}

// 구현
resetCommunityFilters: () => set({
  selectedCategory: 'ALL',
  sortType:         'latest',
  searchKeyword:    null,
  // tradePeriod, tradeType은 실거래 탭 전용 → 초기화 안 함
}),
```

---

# 6. CommunityPage — aptId 변경 대응

## 6.1 aptId 변경 감지 — 초기 마운트 제외

> ⚠️ **[수정 핵심 1]** v2의 `useEffect([apartmentId])`는
> 컴포넌트 최초 마운트 시에도 실행되어 초기 필터를 강제 초기화함.
> `useRef`로 이전 aptId를 추적해 **실제 변경 시에만** 초기화.

```tsx
// pages/CommunityPage.tsx

export const CommunityPage = () => {
  const { apartmentId }          = useUserStore()
  const { selectedCategory, sortType, resetCommunityFilters } = useUIStore()

  // 이전 aptId 추적 — 마운트 시 실행 방지
  const prevAptIdRef = useRef<number | null | undefined>(undefined)

  useEffect(() => {
    // undefined: 최초 마운트 → 건너뜀
    // null → 숫자 또는 숫자 → 다른 숫자: 실제 변경 → 초기화
    if (prevAptIdRef.current === undefined) {
      prevAptIdRef.current = apartmentId
      return
    }
    if (prevAptIdRef.current !== apartmentId) {
      prevAptIdRef.current = apartmentId
      resetCommunityFilters()
    }
  }, [apartmentId])

  // React Query
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['community', 'posts', apartmentId, selectedCategory, sortType],
    queryFn:  () => fetchPosts(apartmentId, selectedCategory, sortType),
    enabled:  apartmentId != null,
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div>
      {/* 배너 우선순위: AptSelectPromptBanner > GuestBanner (섹션 7 참고) */}
      {apartmentId == null
        ? <AptSelectPromptBanner />
        : <GuestBanner />
      }

      <CategoryFilter />
      <SortDropdown />

      {apartmentId == null ? null
        : isLoading ? <PostCardSkeleton count={3} />
        : isError   ? <EmptyState icon="⚠️" title="데이터를 불러올 수 없습니다" />
        : posts?.length === 0 ? <EmptyState icon="📭" title="아직 게시글이 없습니다" />
        : <PostList posts={posts} />
      }
    </div>
  )
}
```

## 6.2 이중 갱신 방지

> ⚠️ **[수정 핵심 2]** `resetCommunityFilters()`가 `selectedCategory`를 변경하면
> queryKey가 2번 바뀌어 API가 2회 호출됨.
> (1회: `apartmentId` 변경, 2회: `selectedCategory` 변경)
>
> 해결: React Query의 `enabled` + staleTime 특성상 queryKey가 짧은 시간 내 여러 번 바뀌어도
> 실제 네트워크 호출은 마지막 값으로 debounce됨. 추가 처리 불필요.
> 단, `staleTime: 5분`이므로 동일 queryKey 재진입 시 캐시 사용.

---

# 7. 배너 우선순위

> ⚠️ **[수정]** v2에서 `GuestBanner`와 `AptSelectPromptBanner` 동시 표시 가능성 미명세.

```
aptId == null:
  → AptSelectPromptBanner 표시 (아파트 선택 유도 우선)
  → GuestBanner 숨김 (아파트 선택이 더 급한 유도)

aptId != null && status === 'GUEST':
  → GuestBanner 표시 (로그인 유도)
  → AptSelectPromptBanner 숨김 (아파트 이미 선택됨)

aptId != null && status !== 'GUEST':
  → 둘 다 숨김
```

```tsx
// CommunityPage 배너 렌더링
{apartmentId == null
  ? <AptSelectPromptBanner />          // 아파트 미선택
  : <GuestBanner />                    // 아파트 선택됨 + GUEST 상태에서 자체 조건 처리
}
// GuestBanner 내부에서 status === 'GUEST' 조건 확인 (기존 로직 유지)
```

---

# 8. AptSelectPromptBanner

```tsx
// components/features/community/AptSelectPromptBanner.tsx

export const AptSelectPromptBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="mx-4 mb-3 px-4 py-3
                      bg-blue-50 border border-blue-100 rounded-xl
                      flex items-center justify-between">
        <span className="text-sm text-blue-700">
          🏢 아파트를 선택하면 해당 커뮤니티를 볼 수 있어요
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-blue-500 ml-3 flex-shrink-0
                     hover:text-blue-700 transition-colors"
        >
          선택하기
        </button>
      </div>

      {/* Portal 렌더링 (아파트 검색 팝업 v3 동일 패턴) */}
      {isModalOpen && (
        <ApartmentSelectModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
```

---

# 9. Header 아파트명 표시

```tsx
// components/layout/Header.tsx

const { pathname }      = useLocation()
const { apartmentName } = useUserStore()

const getHeaderTitle = (path: string): string => {
  if (path === '/') {
    return apartmentName ? `${apartmentName} 커뮤니티` : '커뮤니티'
  }
  return PAGE_TITLES[path] ?? ''
}

const headerTitle = getHeaderTitle(pathname)
```

```
표시 예시:
  aptId 없음:    "커뮤니티"
  잠실엘스 선택: "잠실엘스 커뮤니티"
```

---

# 10. 사이드바 자동 갱신

사이드바 컴포넌트들은 `aptId: string` prop을 받아 queryKey에 포함.
`userStore.apartmentId` 변경 → AppLayout에서 `String()` 변환 → prop 변경 → queryKey 변경 → 자동 re-fetch.

```ts
// queryKey 패턴 (기존 PRD 유지)
['apartment', 'summary', aptId]        // ApartmentInfoCard
['community', 'keywords', aptId]       // TrendingKeywords
['community', 'popular', aptId]        // PopularPosts
['community', 'hotComments', aptId]    // MostCommentedPosts
['ads', slot, regionId, aptId]         // AdSlot
['community', 'posts', apartmentId, selectedCategory, sortType]   // PostList
```

> 별도 갱신 로직 불필요. **추가 구현 없음.**

---

# 11. 로딩 / 전환 UX

```
아파트 선택 직후:
  1. handleSelect(apt) 호출
  2. userStore.apartmentId 변경
  3. Modal 닫힘
  4. Toast: "{aptName} 커뮤니티로 이동했어요"
  5. aptId 변경 → resetCommunityFilters() 실행
  6. queryKey 변경 → isLoading = true → Skeleton 표시
  7. 데이터 로드 완료 → 정상 렌더링

동일 아파트 재선택:
  queryKey 동일 → staleTime 내 캐시 히트 → 즉시 렌더링
```

---

# 12. fetchPosts 및 mock

## 12.1 fetchPosts

```ts
// services/communityService.ts

export const USE_MOCK_POSTS = true   // featureFlags.ts에 추가

export const fetchPosts = async (
  aptId:    number | null,
  category: string,
  sortType: 'latest' | 'popular'
): Promise<Post[]> => {
  if (aptId == null) return []

  if (USE_MOCK_POSTS) return fetchPostsMock(aptId, category, sortType)

  const params = new URLSearchParams({
    aptId:    String(aptId),
    category: category === 'ALL' ? '' : category,
    sortType,
  })
  const res  = await fetch(`/api/community/posts?${params}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error?.message)
  return data.data
}
```

## 12.2 fetchPostsMock

> ⚠️ **[수정]** v2의 `fetchPostsMock`이 aptId를 받지만 필터링에 사용 안 함.
> aptId 기준 필터링 로직 추가.

```ts
// data/mockCommunityData.ts

// mockPosts에 aptId 필드 추가
export const mockPosts: Post[] = [
  {
    id: 1, aptId: 1,   // ← aptId 추가
    title: '헬스장 이용 시간 변경되었나요?',
    category: '질문', createdAt: '어제', likeCount: 3, commentCount: 5,
    nickname: '익명_1234', apartmentName: '잠실엘스',
  },
  {
    id: 2, aptId: 1,
    title: '관리비 고지서 확인하세요',
    category: '정보', createdAt: '5시간 전', likeCount: 8, commentCount: 3,
    nickname: '익명_5678', apartmentName: '잠실엘스',
  },
  {
    id: 3, aptId: 2,   // 다른 아파트
    title: '헬리오시티 주차 문제',
    category: '민원', createdAt: '3시간 전', likeCount: 12, commentCount: 7,
    nickname: '익명_9012', apartmentName: '헬리오시티',
  },
]

export const fetchPostsMock = (
  aptId:    number,
  category: string,
  sortType: 'latest' | 'popular'
): Post[] => {
  // ⚠️ [수정] aptId 기준 필터링 추가
  let posts = mockPosts.filter(p => p.aptId === aptId)

  // 카테고리 필터
  if (category !== 'ALL') {
    posts = posts.filter(p => p.category === category)
  }

  // 정렬
  if (sortType === 'popular') {
    posts = [...posts].sort((a, b) =>
      (b.likeCount * 2 + b.commentCount) - (a.likeCount * 2 + a.commentCount)
    )
  }
  // latest는 mockPosts 순서 그대로 (최신순으로 정렬되어 있다고 가정)

  return posts
}
```

## 12.3 featureFlags.ts 추가

```ts
// config/featureFlags.ts
export const USE_KAKAO_MAP   = false
export const USE_MOCK_SEARCH = true
export const USE_MOCK_AD     = true
export const USE_MOCK_POSTS  = true   // ← 신규 추가
```

---

# 13. 에러 / 빈 상태 처리

| 상황 | UI |
|------|-----|
| aptId 없음 | `AptSelectPromptBanner` (PostList 렌더링 안 함) |
| aptId 있지만 게시글 없음 | `EmptyState icon="📭" title="아직 게시글이 없습니다"` |
| API 404 (잘못된 aptId) | `EmptyState icon="🏢" title="존재하지 않는 아파트입니다"` |
| API 실패 | `EmptyState icon="⚠️" title="데이터를 불러올 수 없습니다"` |

> 렌더링 우선순위:
> `aptId == null` → `isLoading` → `isError` → `posts.length === 0` → `<PostList />`

---

# 14. 컴포넌트 수정 목록

| 컴포넌트 | 수정 내용 | 신규 여부 |
|---------|---------|---------|
| `userStore.ts` | persist 미들웨어 추가 (status + apartmentId + apartmentName) | 수정 |
| `uiStore.ts` | `resetCommunityFilters` 액션 추가 | 수정 |
| `AppLayout.tsx` | `aptIdStr = String(apartmentId ?? '')` 변환, LeftSidebar/RightSidebar에 전달 | 수정 |
| `CommunityPage.tsx` | `prevAptIdRef` 패턴, React Query, 배너 우선순위 분기 | 수정 |
| `Header.tsx` | `getHeaderTitle()` — apartmentName 조건 처리 | 수정 |
| `mockCommunityData.ts` | Post 타입에 `aptId` 필드 추가, fetchPostsMock aptId 필터링 | 수정 |
| `featureFlags.ts` | `USE_MOCK_POSTS = true` 추가 | 수정 |
| `AptSelectPromptBanner.tsx` | 신규 | 신규 |
| `communityService.ts` | `fetchPosts(aptId, ...)` | 신규 |

---

# 15. 파일 구조

```
src/
├── components/
│   ├── layout/
│   │   └── Header.tsx                      ← getHeaderTitle 수정
│   └── features/
│       └── community/
│           └── AptSelectPromptBanner.tsx    ← 신규
├── pages/
│   └── CommunityPage.tsx                   ← prevAptIdRef 패턴 + React Query
├── services/
│   └── communityService.ts                 ← fetchPosts + USE_MOCK_POSTS 분기
├── data/
│   └── mockCommunityData.ts                ← Post.aptId 추가, fetchPostsMock 수정
├── config/
│   └── featureFlags.ts                     ← USE_MOCK_POSTS 추가
└── stores/
    ├── userStore.ts                        ← persist (status + aptId + aptName)
    └── uiStore.ts                          ← resetCommunityFilters 액션 추가
```

---

# 16. 최종 생성 요구사항

1. **userStore SSOT** — URL 쿼리 파라미터 없음, 라우팅 변경 없음
2. **persist 범위** — `status` + `apartmentId` + `apartmentName` (userId, nickname 제외)
3. **aptId 타입 변환** — AppLayout에서 1회 `String()` 변환, 사이드바에 prop으로 전달
4. **`resetCommunityFilters`** — uiStore 내부 액션, category/sortType/searchKeyword 초기화
5. **최초 마운트 제외** — `prevAptIdRef` 패턴으로 마운트 시 불필요한 초기화 방지
6. **배너 우선순위** — `aptId == null` → `AptSelectPromptBanner` / `aptId != null` → `GuestBanner` 자체 조건 처리
7. **CommunityPage 렌더링 순서** — `aptId == null` → `isLoading` → `isError` → `posts.length === 0` → `PostList`
8. **`USE_MOCK_POSTS`** — `featureFlags.ts`에 추가, `communityService.ts`에서 분기
9. **`fetchPostsMock`** — aptId + category + sortType 모두 실제 필터링 적용
10. **mock Post 타입** — `aptId` 필드 추가, 아파트별 게시글 분리
11. **Header 타이틀** — `getHeaderTitle()` 함수, apartmentName 있으면 `"{aptName} 커뮤니티"`
12. **사이드바 자동 갱신** — AppLayout의 aptIdStr prop 변경 → queryKey 변경 → 자동 re-fetch
13. **Toast** — `"{aptName} 커뮤니티로 이동했어요"` (팝업 v3 기존 코드 유지)
14. **에러/빈 상태** — 섹션 13 기준, EmptyState 컴포넌트 재사용
