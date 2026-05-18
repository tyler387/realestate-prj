# 🏢 부동산 커뮤니티 사이드 UI 확장 PRD
## v3.0 | 검증 완료 | AI Agent용

> **범위**: 데스크탑 좌/우 사이드바 UI — LeftSidebar / RightSidebar
> **연관 PRD**: UI Frame v4 / 커뮤니티 PRD / 인증 PRD v2
>
> **v3 검증 변경 요약**:
> - `hidden lg:block` + `showLeftSidebar` 조건부 렌더링 중복 → 역할 분리로 정리
> - `sticky` 위치가 `aside`와 내부 `div` 사이에서 불일치 → `aside` 단일 적용으로 확정
> - `/post/:id` 에서 TabBar 없음 → sticky top을 `top-[56px]`로 분기 처리
> - `aptId` 출처 미명세 → userStore에서 가져오는 방식으로 확정
> - `searchKeyword` 초기화 시점 미명세 → 페이지 이탈 / CategoryFilter 변경 시 초기화 명세
> - `USE_MOCK` 조건부 hooks 호출 → React hooks 규칙 위반, 패턴 수정

---

# 1. 개요

## 목적

기존 중앙 피드 중심 UI의 좌우 여백을 활용:

- 정보 밀도 증가
- 사용자 체류 시간 증가
- 커뮤니티 참여 유도
- 부동산 특화 컨텍스트 강화

## 적용 범위

사이드바는 **데스크탑 전용** (1024px 이상).
1023px 이하에서는 렌더링하지 않음.

---

# 2. 기술 스택 추가

기존 스택(React 18 / TypeScript / Tailwind / React Router v6 / Zustand)에 추가:

| 항목 | 버전 | 용도 |
|------|------|------|
| TanStack Query (React Query) | v5 | 사이드바 독립 fetch / 캐싱 |

> 사이드바 4개 컴포넌트가 각각 캐싱 주기가 다르므로 React Query 적합.
> 기존 Zustand 상태와 query key 네임스페이스가 분리되어 충돌 없음.

---

# 3. 전체 레이아웃 구조

## 3.1 3컬럼 구성

```
┌──────────────────────────────────────────────────────┐  Header (fixed, z-30, h-14)
├──────────────────────────────────────────────────────┤  TabBar (fixed, z-20, h-12)
│                                                      │
│  [LeftSidebar]    [    MainFeed    ]  [RightSidebar] │
│     260px           max-w-[768px]        260px       │
│  lg:block only        flex-1 min-w-0   lg:block only │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 3.2 PageWrapper 구조 (AppLayout.tsx 수정)

> ⚠️ 기존 MainContent `max-w-[768px] margin: 0 auto` 구조와 사이드바 충돌.
> PageWrapper를 `flex justify-center`로 감싸서 3컬럼 나란히 배치.

```tsx
// AppLayout.tsx

export const AppLayout = () => {
  const { pathname } = useLocation()
  const { apartmentId } = useUserStore()

  // 사이드바 표시 조건 (섹션 3.3 참고)
  const showLeftSidebar  = pathname === '/'
  const showRightSidebar = pathname === '/' || pathname.startsWith('/post/')

  // 페이지별 sticky top 분기 (섹션 3.4 참고)
  const sidebarStickyTop = (pathname === '/' || pathname === '/map' || pathname === '/trade')
    ? 'top-[104px]'   // Header(56) + TabBar(48)
    : 'top-[56px]'    // Header만

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabBar />

      {/* PageWrapper — 3컬럼 flex */}
      <div className="flex justify-center pt-[104px]">

        {/* LeftSidebar */}
        {showLeftSidebar && (
          <aside
            className={`
              hidden lg:block
              w-[260px] flex-shrink-0
              pt-4 pr-4
              sticky ${sidebarStickyTop} self-start h-fit
            `}
          >
            <LeftSidebar aptId={String(apartmentId ?? 'apt-001')} />
          </aside>
        )}

        {/* MainContent */}
        <main className="w-full max-w-[768px] flex-1 min-w-0">
          <Outlet />
        </main>

        {/* RightSidebar */}
        {showRightSidebar && (
          <aside
            className={`
              hidden lg:block
              w-[260px] flex-shrink-0
              pt-4 pl-4
              sticky ${sidebarStickyTop} self-start h-fit
            `}
          >
            <RightSidebar aptId={String(apartmentId ?? 'apt-001')} />
          </aside>
        )}

      </div>
    </div>
  )
}
```

> ⚠️ **[수정 1]** v2에서 `hidden lg:block`(CSS 숨김)과 `{showLeftSidebar && ...}`(JS 조건 렌더링)을 함께 써서 중복.
> 역할 분리:
> - `{showLeftSidebar && ...}` → **페이지별 표시 여부** (JS 조건 렌더링, DOM에서 제거)
> - `hidden lg:block` → **뷰포트 크기별 표시 여부** (CSS, DOM은 유지하되 숨김)
> 두 조건이 모두 필요하므로 함께 사용하는 것이 맞음. 역할이 다름.

> ⚠️ **[수정 2]** v2에서 `sticky`를 `aside` 안의 자식 `div`에 적용.
> `sticky`는 스크롤 컨테이너의 직접 자식에 적용해야 동작.
> `aside` 자체에 `sticky self-start h-fit` 적용으로 수정.

## 3.3 사이드바 표시 조건

| 페이지 | LeftSidebar | RightSidebar |
|--------|:-----------:|:------------:|
| / (커뮤니티) | ✅ | ✅ |
| /trade | ❌ | ❌ |
| /map | ❌ | ❌ |
| /post/:id | ❌ | ✅ |
| /write | ❌ | ❌ |
| /verify | ❌ | ❌ |
| /mypage | ❌ | ❌ |
| /login, /signup | ❌ | ❌ |

## 3.4 페이지별 sticky top 분기

> ⚠️ **[수정 3]** `/post/:id`는 TabBar 없음 → `top-[104px]` 고정이면 56px 허공이 생김.

| 페이지 | TabBar 유무 | sticky top |
|--------|:-----------:|-----------|
| / | ✅ | `top-[104px]` |
| /post/:id | ❌ | `top-[56px]` |

```ts
const sidebarStickyTop = (showTabBar)
  ? 'top-[104px]'
  : 'top-[56px]'

// showTabBar 기준: pathname === '/' || pathname === '/map' || pathname === '/trade'
// /post/:id 는 TabBar 없으므로 top-[56px]
```

---

# 4. aptId 출처

> ⚠️ **[수정 4]** v2에서 `currentAptId`가 어디서 오는지 미명세.

```ts
// userStore에서 가져옴
const { apartmentId } = useUserStore()

// aptId 결정 우선순위:
// 1. VERIFIED 사용자: userStore.apartmentId (인증된 아파트)
// 2. GUEST / MEMBER: mock 기본값 'apt-001' (잠실엘스)
//    → 실제 서비스에서는 지역 기반 기본값 또는 인기 아파트로 대체

const aptId = String(apartmentId ?? 'apt-001')
```

---

# 5. 반응형 브레이크포인트

| 구간 | 범위 | 사이드바 처리 |
|------|------|-------------|
| Mobile + Tablet | ~ 1023px | `hidden` (CSS, DOM 유지) |
| Desktop | 1024px ~ | `lg:block` (표시) |

> 3컬럼 총 width = 260 + 768 + 260 = **1288px**.
> 1024~1288px 구간: MainFeed(`flex-1 min-w-0`)가 자연스럽게 축소.
> 사이드바는 `flex-shrink-0`으로 폭 고정.

---

# 6. 공통 카드 스타일

```
Card 래퍼:  bg-white rounded-xl border border-gray-100 p-4 mb-4
CardTitle:  text-sm font-bold text-gray-700 mb-3
구분선:      border-b border-gray-100
shadow:     없음 (flat UI)
```

재사용 가능한 공통 컴포넌트:

```tsx
// components/sidebar/SidebarCard.tsx
export const SidebarCard = ({ children }: { children: ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
    {children}
  </div>
)

export const CardTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="text-sm font-bold text-gray-700 mb-3">{children}</h3>
)

export const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-xs text-gray-600 py-1 border-b border-gray-100 last:border-b-0">
    <span className="text-gray-400">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
)
```

---

# 7. LeftSidebar

```tsx
// components/layout/LeftSidebar.tsx
export const LeftSidebar = ({ aptId }: { aptId: string }) => (
  <div>
    <ApartmentInfoCard aptId={aptId} />
    <TrendingKeywords aptId={aptId} />
  </div>
)
```

---

## 7.1 ApartmentInfoCard

### 화면 구성

```
┌──────────────────────────┐
│  지역 정보                │  ← CardTitle
│  🏢 잠실엘스              │  ← text-base font-bold text-gray-900
│  서울 송파구 잠실동        │  ← text-xs text-gray-500 mt-0.5
├──────────────────────────┤  ← 구분선 (mt-3 mb-1)
│  세대수       1,678세대   │
│  준공년도     2008년      │  ← InfoRow
│  최근 실거래  23억 5천만   │  ← formatPrice(recentPrice)
└──────────────────────────┘
```

### 타입

```ts
type ApartmentSummary = {
  aptId: string
  aptName: string
  location: string
  households: number
  builtYear: number
  recentPrice: number    // 만원 단위 → formatPrice() 적용
}
```

### Mock 데이터

```ts
// data/mockSidebarData.ts
export const mockApartmentSummary: ApartmentSummary = {
  aptId: 'apt-001',
  aptName: '잠실엘스',
  location: '서울 송파구 잠실동',
  households: 1678,
  builtYear: 2008,
  recentPrice: 235000,
}
```

### API (실제 연동 시)

```
GET /api/apartment/{aptId}/summary
```

### 캐싱

```ts
staleTime: 1000 * 60 * 60   // 60분
gcTime:    1000 * 60 * 120  // 120분
```

### 로딩 / 에러

```
로딩: ApartmentInfoCardSkeleton
에러: SidebarCard 유지 + "아파트 정보를 불러올 수 없습니다"
      className="text-xs text-gray-400 text-center py-4"
```

### 컴포넌트 트리

```tsx
<SidebarCard>
  <CardTitle>지역 정보</CardTitle>
  {isLoading && <ApartmentInfoCardSkeleton />}
  {isError  && <ErrorMessage text="아파트 정보를 불러올 수 없습니다" />}
  {data && (
    <>
      <p className="text-base font-bold text-gray-900">🏢 {data.aptName}</p>
      <p className="text-xs text-gray-500 mt-0.5">{data.location}</p>
      <div className="mt-3">
        <InfoRow label="세대수"      value={`${data.households.toLocaleString()}세대`} />
        <InfoRow label="준공년도"    value={`${data.builtYear}년`} />
        <InfoRow label="최근 실거래" value={formatPrice(data.recentPrice)} />
      </div>
    </>
  )}
</SidebarCard>
```

---

## 7.2 TrendingKeywords

### 화면 구성

```
┌──────────────────────────┐
│  🔥 인기 키워드            │  ← CardTitle
│                           │
│  [관리비] [주차] [전세]    │
│  [헬스장] [소음] [택배]    │  ← flex-wrap, 최대 10개
│  [엘리베이터] [분리수거]   │
└──────────────────────────┘
```

### 타입

```ts
type TrendingKeyword = string
```

### Mock 데이터

```ts
export const mockTrendingKeywords: TrendingKeyword[] = [
  '관리비', '주차', '전세', '헬스장',
  '소음', '택배', '엘리베이터', '분리수거',
  '민원', '공지',
]
```

### API

```
GET /api/community/{aptId}/keywords
```

### 캐싱

```ts
staleTime: 1000 * 60 * 5   // 5분
gcTime:    1000 * 60 * 10  // 10분
```

### 로딩 / 에러

```
로딩: Chip Skeleton 6개 (flex-wrap gap-2)
에러: return null (카드 전체 숨김 — 키워드 없으면 UX 가치 없음)
```

### PostList 연동

> URL Query 방식 사용 안 함 → uiStore.searchKeyword 방식 사용.

```ts
// uiStore 추가 필드
searchKeyword: string | null   // 기본값: null
setSearchKeyword: (kw: string | null) => void
```

```ts
// 클릭 핸들러 (토글)
const handleKeywordClick = (keyword: string) => {
  const next = searchKeyword === keyword ? null : keyword
  setSearchKeyword(next)
  if (next !== null) setCategory('ALL')   // 키워드 선택 시 카테고리 초기화
}
```

```ts
// searchKeyword 초기화 시점
// 1. 커뮤니티(/) 페이지에서 벗어날 때
useEffect(() => {
  return () => { setSearchKeyword(null) }   // CommunityPage unmount 시
}, [])

// 2. CategoryFilter 변경 시 (카테고리 선택하면 키워드 해제)
const handleCategoryChange = (category: string) => {
  setCategory(category)
  setSearchKeyword(null)   // 키워드 초기화
}
```

### PostList 필터링 적용

```ts
// CommunityPage.tsx
const { searchKeyword, selectedCategory } = useUIStore()

const filteredPosts = posts
  .filter(p => selectedCategory === 'ALL' || p.category === selectedCategory)
  .filter(p =>
    searchKeyword
      ? p.title.includes(searchKeyword) || p.content.includes(searchKeyword)
      : true
  )
```

### Chip 스타일

```
기본:   bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs cursor-pointer hover:bg-gray-200
선택됨: bg-blue-500 text-white   rounded-full px-3 py-1 text-xs cursor-pointer
```

### 컴포넌트 트리

```tsx
{!isError && (
  <SidebarCard>
    <CardTitle>🔥 인기 키워드</CardTitle>
    {isLoading && <KeywordsSkeleton />}
    {data && (
      <div className="flex flex-wrap gap-2">
        {data.map(keyword => (
          <KeywordChip
            key={keyword}
            keyword={keyword}
            isSelected={searchKeyword === keyword}
            onClick={() => handleKeywordClick(keyword)}
          />
        ))}
      </div>
    )}
  </SidebarCard>
)}
```

---

# 8. RightSidebar

```tsx
// components/layout/RightSidebar.tsx
export const RightSidebar = ({ aptId }: { aptId: string }) => (
  <div>
    <PopularPosts aptId={aptId} />
    <MostCommentedPosts aptId={aptId} />
  </div>
)
```

---

## 8.1 PopularPosts

### 화면 구성

```
┌──────────────────────────┐
│  🏆 인기 글               │  ← CardTitle
│                           │
│  1  헬스장 이용 시간 변…   │  ← truncate 1줄
│     ❤️ 12  💬 5           │  ← 메타
│  ────────────────────     │
│  2  관리비 고지서 확인…    │
│     ❤️ 8   💬 3           │
└──────────────────────────┘
```

### 정렬 기준

```ts
score = (likeCount * 2) + commentCount   // 내림차순
```

기간: 최근 24시간 / 최대 5개

### 타입

```ts
type PopularPost = {
  postId: number
  title: string
  likeCount: number
  commentCount: number
}
```

### Mock 데이터

```ts
export const mockPopularPosts: PopularPost[] = [
  { postId: 1, title: '헬스장 이용 시간 변경되었나요?',     likeCount: 12, commentCount: 5 },
  { postId: 2, title: '관리비 고지서 확인하세요',            likeCount: 8,  commentCount: 3 },
  { postId: 3, title: '주차 문제 어떻게 생각하세요?',       likeCount: 7,  commentCount: 7 },
  { postId: 4, title: '택배 보관함 위치 아시는 분 계세요?',  likeCount: 5,  commentCount: 4 },
  { postId: 5, title: '분리수거 요일 바뀌었어요',            likeCount: 4,  commentCount: 6 },
]
```

### API

```
GET /api/community/{aptId}/posts/popular
```

### 캐싱

```ts
staleTime: 1000 * 60 * 5
gcTime:    1000 * 60 * 10
```

### 로딩 / 에러

```
로딩: PostListSkeleton (5행)
에러: SidebarCard 유지 + "인기 글을 불러올 수 없습니다"
      className="text-xs text-gray-400 text-center py-4"
```

### 컴포넌트 트리

```tsx
<SidebarCard>
  <CardTitle>🏆 인기 글</CardTitle>
  {isLoading && <PostListSkeleton />}
  {isError   && <ErrorMessage text="인기 글을 불러올 수 없습니다" />}
  {data?.map((post, i) => (
    <PopularPostItem key={post.postId} rank={i + 1} post={post} />
  ))}
</SidebarCard>

// PopularPostItem
<div
  onClick={() => navigate(`/post/${post.postId}`)}
  className="flex items-start gap-2 py-2 border-b border-gray-100
             last:border-b-0 cursor-pointer hover:bg-gray-50
             -mx-1 px-1 rounded transition-colors"
>
  <span className={`w-5 text-sm font-bold flex-shrink-0 mt-0.5
    ${rank <= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
    {rank}
  </span>
  <div className="flex-1 min-w-0">
    <p className="text-sm text-gray-800 truncate">{post.title}</p>
    <div className="flex gap-2 mt-0.5">
      <span className="text-xs text-gray-400">❤️ {post.likeCount}</span>
      <span className="text-xs text-gray-400">💬 {post.commentCount}</span>
    </div>
  </div>
</div>
```

---

## 8.2 MostCommentedPosts

### 화면 구성

```
┌──────────────────────────┐
│  💬 댓글 많은 글           │  ← CardTitle
│                           │
│  엘리베이터 소음 민원…     │  ← truncate 1줄
│  💬 23개                  │
│  ────────────────────     │
│  주차 자리 배정 방식…       │
│  💬 18개                  │
└──────────────────────────┘
```

### 정렬 기준

commentCount 내림차순 / 최근 24시간 / 최대 5개

### 타입

```ts
type MostCommentedPost = {
  postId: number
  title: string
  commentCount: number
}
```

### Mock 데이터

```ts
export const mockMostCommentedPosts: MostCommentedPost[] = [
  { postId: 7,  title: '엘리베이터 소음 민원 넣으신 분',        commentCount: 23 },
  { postId: 8,  title: '주차 자리 배정 방식 바꿔야 하지 않나요', commentCount: 18 },
  { postId: 3,  title: '주차 문제 어떻게 생각하세요?',           commentCount: 7  },
  { postId: 9,  title: '헬스장 회원 등록 어떻게 하나요',         commentCount: 6  },
  { postId: 10, title: '분리수거 요일 다들 알고 계신가요',        commentCount: 5  },
]
```

### API

```
GET /api/community/{aptId}/posts/hot-comments
```

### 캐싱

```ts
staleTime: 1000 * 60 * 5
gcTime:    1000 * 60 * 10
```

### 로딩 / 에러

```
로딩: PostListSkeleton (5행)
에러: SidebarCard 유지 + "데이터를 불러올 수 없습니다"
      className="text-xs text-gray-400 text-center py-4"
```

### 컴포넌트 트리

```tsx
<SidebarCard>
  <CardTitle>💬 댓글 많은 글</CardTitle>
  {isLoading && <PostListSkeleton />}
  {isError   && <ErrorMessage text="데이터를 불러올 수 없습니다" />}
  {data?.map(post => (
    <CommentedPostItem key={post.postId} post={post} />
  ))}
</SidebarCard>

// CommentedPostItem
<div
  onClick={() => navigate(`/post/${post.postId}`)}
  className="py-2 border-b border-gray-100 last:border-b-0
             cursor-pointer hover:bg-gray-50
             -mx-1 px-1 rounded transition-colors"
>
  <p className="text-sm text-gray-800 truncate">{post.title}</p>
  <p className="text-xs text-gray-400 mt-0.5">💬 {post.commentCount}개</p>
</div>
```

---

# 9. Skeleton UI

```tsx
// components/sidebar/SidebarSkeleton.tsx

// 공통 Skeleton 셀
const SkeletonBox = ({ className }: { className: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
)

// ApartmentInfoCard Skeleton
export const ApartmentInfoCardSkeleton = () => (
  <div className="space-y-2">
    <SkeletonBox className="h-4 w-3/4" />   {/* 아파트명 */}
    <SkeletonBox className="h-3 w-1/2" />   {/* 위치 */}
    <div className="mt-3 space-y-2">
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-full" />
    </div>
  </div>
)

// PopularPosts / MostCommentedPosts Skeleton (5행 공용)
export const PostListSkeleton = () => (
  <div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-2 py-2 border-b border-gray-100 last:border-b-0">
        <SkeletonBox className="w-4 h-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1.5">
          <SkeletonBox className="h-3 w-full" />
          <SkeletonBox className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

// TrendingKeywords Skeleton (6개 Chip)
export const KeywordsSkeleton = () => (
  <div className="flex flex-wrap gap-2">
    {[...Array(6)].map((_, i) => (
      <SkeletonBox key={i} className="w-14 h-6 rounded-full" />
    ))}
  </div>
)

// 공용 에러 메시지
export const ErrorMessage = ({ text }: { text: string }) => (
  <p className="text-xs text-gray-400 text-center py-4">{text}</p>
)
```

---

# 10. 에러 처리

| 컴포넌트 | 에러 UI |
|---------|---------|
| ApartmentInfoCard | SidebarCard 유지 + `<ErrorMessage>` |
| TrendingKeywords | `return null` (카드 전체 숨김) |
| PopularPosts | SidebarCard 유지 + `<ErrorMessage>` |
| MostCommentedPosts | SidebarCard 유지 + `<ErrorMessage>` |

---

# 11. Mock hooks (React hooks 규칙 준수)

> ⚠️ **[수정 5]** v2의 `if (USE_MOCK) return ...` 패턴은
> 조건부로 `useQuery`가 실행되어 **React hooks 규칙 위반**.
> hooks는 항상 같은 순서로 호출되어야 함.
>
> 수정: `useQuery` 내부에서 `enabled` + `initialData` 활용.

```ts
// hooks/useSidebarData.ts

const USE_MOCK = true   // API 연동 전까지 true 유지

export const useApartmentSummary = (aptId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.apartmentSummary(aptId),
    queryFn: () => fetch(`/api/apartment/${aptId}/summary`).then(r => r.json()),
    enabled: !USE_MOCK,                          // mock 모드에서 fetch 안 함
    initialData: USE_MOCK ? mockApartmentSummary : undefined,
    staleTime: 1000 * 60 * 60,
    gcTime:    1000 * 60 * 120,
  })
}

export const useTrendingKeywords = (aptId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.trendingKeywords(aptId),
    queryFn: () => fetch(`/api/community/${aptId}/keywords`).then(r => r.json()),
    enabled: !USE_MOCK,
    initialData: USE_MOCK ? mockTrendingKeywords : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
}

export const usePopularPosts = (aptId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.popularPosts(aptId),
    queryFn: () => fetch(`/api/community/${aptId}/posts/popular`).then(r => r.json()),
    enabled: !USE_MOCK,
    initialData: USE_MOCK ? mockPopularPosts : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
}

export const useMostCommentedPosts = (aptId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.mostCommented(aptId),
    queryFn: () => fetch(`/api/community/${aptId}/posts/hot-comments`).then(r => r.json()),
    enabled: !USE_MOCK,
    initialData: USE_MOCK ? mockMostCommentedPosts : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
}
```

---

# 12. 상태 관리

## React Query 설정

```ts
// query key
const QUERY_KEYS = {
  apartmentSummary: (aptId: string) => ['apartment', 'summary', aptId],
  trendingKeywords: (aptId: string) => ['community', 'keywords', aptId],
  popularPosts:     (aptId: string) => ['community', 'popular', aptId],
  mostCommented:    (aptId: string) => ['community', 'hotComments', aptId],
}
```

## 캐싱 전략

| 컴포넌트 | staleTime | gcTime |
|---------|-----------|--------|
| ApartmentInfoCard | 60분 | 120분 |
| TrendingKeywords | 5분 | 10분 |
| PopularPosts | 5분 | 10분 |
| MostCommentedPosts | 5분 | 10분 |

## uiStore 추가 필드

```ts
searchKeyword: string | null        // 기본값: null
setSearchKeyword: (kw: string | null) => void
```

## searchKeyword 초기화 시점

```ts
// 1. CommunityPage unmount 시 (페이지 이탈)
useEffect(() => {
  return () => { setSearchKeyword(null) }
}, [])

// 2. CategoryFilter 선택 시
const handleCategoryChange = (category: string) => {
  setCategory(category)
  setSearchKeyword(null)
}

// 3. 검색어 입력 시 (SearchInput — /trade/search 에서만 해당)
// → 커뮤니티 키워드와 별도 상태이므로 충돌 없음
```

---

# 13. 컴포넌트 파일 구조

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx              ← PageWrapper 구조로 수정
│   │   ├── LeftSidebar.tsx            ← 신규
│   │   └── RightSidebar.tsx           ← 신규
│   └── features/
│       └── sidebar/
│           ├── SidebarCard.tsx        ← 공통 Card / CardTitle / InfoRow
│           ├── SidebarSkeleton.tsx    ← 공통 Skeleton / ErrorMessage
│           ├── ApartmentInfoCard.tsx
│           ├── TrendingKeywords.tsx
│           ├── KeywordChip.tsx
│           ├── PopularPosts.tsx
│           ├── PopularPostItem.tsx
│           ├── MostCommentedPosts.tsx
│           └── CommentedPostItem.tsx
├── hooks/
│   └── useSidebarData.ts              ← USE_MOCK + useQuery 통합
├── data/
│   └── mockSidebarData.ts
└── stores/
    └── uiStore.ts                     ← searchKeyword 필드 추가
```

---

# 14. 디자인 토큰 (사이드바 추가분)

```
SidebarCard:   bg-white rounded-xl border border-gray-100 p-4 mb-4
CardTitle:     text-sm font-bold text-gray-700 mb-3
InfoRow label: text-xs text-gray-400
InfoRow value: text-xs font-medium text-gray-700
구분선:         border-b border-gray-100
순위 1~3위:     text-blue-500 font-bold
순위 4~5위:     text-gray-400 font-bold
게시글 제목:    text-sm text-gray-800 truncate
메타:           text-xs text-gray-400
Chip 기본:      bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs
Chip 선택:      bg-blue-500 text-white rounded-full px-3 py-1 text-xs
hover 행:       hover:bg-gray-50 transition-colors rounded -mx-1 px-1
```

---

# 15. 최종 생성 요구사항

AI Agent는 아래 조건을 만족하는 사이드바 UI를 생성하라.

1. **AppLayout 수정** — 섹션 3.2 PageWrapper flex 구조, `aside`에 sticky 직접 적용
2. **조건부 렌더링 + CSS hidden 분리** — `{show && <aside className="hidden lg:block ...">}` 패턴 유지
3. **sticky top 분기** — TabBar 있는 페이지 `top-[104px]` / 없는 페이지 `top-[56px]`
4. **h-fit 필수** — `aside`에 `h-fit` 없으면 sticky가 동작하지 않음
5. **aptId 출처** — `useUserStore().apartmentId ?? 'apt-001'`
6. **LeftSidebar** — ApartmentInfoCard + TrendingKeywords, 섹션 7 기준
7. **RightSidebar** — PopularPosts + MostCommentedPosts, 섹션 8 기준
8. **searchKeyword 연동** — uiStore 필드, 초기화 시점 섹션 12 기준
9. **hooks 규칙 준수** — `enabled: !USE_MOCK` + `initialData` 패턴, 조건부 return 금지
10. **Skeleton** — 섹션 9 기준, `SidebarSkeleton.tsx` 공통화
11. **에러 처리** — 섹션 10 기준, `ErrorMessage` 공통 컴포넌트
12. **공통 SidebarCard** — `SidebarCard / CardTitle / InfoRow` 재사용
13. **제목 truncate** — 모든 게시글 제목 `truncate` (1줄 말줄임)
14. **flat UI** — shadow 없음, `border border-gray-100`
15. **formatPrice 재사용** — ApartmentInfoCard.recentPrice에 기존 유틸 적용
16. **min-w-0** — MainContent `flex-1 min-w-0` 필수 (flex 압축 허용)
