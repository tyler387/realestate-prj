# 📄 UI PRD — 거주지 기반 익명 커뮤니티
## Frame & Layout 검증 완료 v4

> **이 버전의 검증 범위**: 레이아웃 레이어링 · 고정 요소 충돌 · 스크롤 영역 · 화면 전환 프레임 · 컴포넌트 트리 일관성
> **기능 로직 (인증 흐름, 상태관리 세부 동작)은 별도 기능 PRD로 분리 예정**

---

# 1. 목적

LLM을 활용하여 React 기반 UI 프레임을 생성하기 위한 문서.

- 페이지 구조 및 레이아웃 확정
- 컴포넌트 트리 정의
- 고정(fixed) 요소 레이어 명세
- 스크롤 영역 명세
- mock 데이터 기반 정적 렌더링

---

# 2. 기술 스택

| 항목 | 버전 |
|------|------|
| React | 18+ |
| TypeScript | 5+ |
| Tailwind CSS | 3+ |
| React Router | v6 |
| Zustand | 4+ |

---

# 3. 라우팅 구조

```
/           → 커뮤니티 페이지
/map        → 지도 페이지
/post/:id   → 게시글 상세
/write      → 글 작성
/verify     → 거주지 인증
/mypage     → 마이페이지
```

---

# 4. 전체 레이아웃 프레임

## 4.1 레이어 구조 (z-index 기준)

```
z-50  FloatingWriteButton (fixed)
z-40  CommentInput — /post/:id 에서만 (fixed bottom)
z-30  Header (fixed top)
z-20  TabBar (fixed top, Header 바로 아래)
z-10  ApartmentPanel — /map 에서만 (fixed bottom)
z-0   MainContent (스크롤 영역)
```

> ⚠️ **[수정]** v3에서 레이어 충돌 2건 발견
> - `/post/:id` 에서 `CommentInput(fixed bottom)`과 `FAB`가 겹침
>   → FAB는 `/post/:id` 에서 **숨김** 처리
> - `/map` 에서 `ApartmentPanel(fixed bottom)`과 `FAB`가 겹침
>   → FAB는 `/map` 에서도 **숨김** 처리

---

## 4.2 고정(fixed) 요소 표시 조건 일람

| 요소 | / | /map | /post/:id | /write | /verify | /mypage |
|------|---|------|-----------|--------|---------|---------|
| Header | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TabBar | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| FAB | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| CommentInput | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ApartmentPanel | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4.3 MainContent 상단 여백 (padding-top) 페이지별 명세

> Header + TabBar 고정 시 콘텐츠가 가려지는 문제 방지

| 페이지 | Header | TabBar | padding-top |
|--------|--------|--------|-------------|
| / | 56px | 48px | **104px** |
| /map | 56px | 48px | **104px** |
| /post/:id | 56px | 없음 | **56px** |
| /write | 56px | 없음 | **56px** |
| /verify | 56px | 없음 | **56px** |
| /mypage | 56px | 없음 | **56px** |

---

## 4.4 MainContent 하단 여백 (padding-bottom) 페이지별 명세

> fixed 하단 요소에 콘텐츠가 가려지는 문제 방지

| 페이지 | 하단 fixed 요소 | padding-bottom |
|--------|----------------|----------------|
| / | FAB (56px + 여유) | **96px** |
| /map | ApartmentPanel (가변) | **0** (MapPage 자체가 flex 구조) |
| /post/:id | CommentInput (56px) | **72px** |
| /write | 없음 | **24px** |
| /verify | 없음 | **24px** |
| /mypage | FAB (56px + 여유) | **96px** |

---

# 5. AppLayout 컴포넌트 트리

```
<AppLayout>                         ← 전체 래퍼, h-screen, flex-col
  <Header />                        ← fixed top-0, h-14 (56px), z-30
  <TabBar />                        ← fixed top-14, h-12 (48px), z-20
                                      (현재 라우트에 따라 hidden 처리)

  <main>                            ← flex-1, overflow-y-auto
    <Outlet />                      ← 페이지 렌더링
  </main>

  <FloatingWriteButton />           ← fixed, z-50
                                      (현재 라우트에 따라 hidden 처리)
</AppLayout>
```

---

# 6. 공통 컴포넌트 프레임

## 6.1 Header

```
[고정 레이어: fixed top-0 w-full h-14 bg-white border-b z-30]

레이아웃: flex items-center justify-between px-4

좌측 영역:
  - 기본: 로고 텍스트
  - 뒤로가기 패턴 페이지(/post/:id, /write, /verify): ← 아이콘 버튼

중앙 영역:
  - 페이지 타이틀 텍스트 (절대 중앙)

우측 영역:
  - 기본: 마이페이지 아이콘 버튼
  - 뒤로가기 패턴 페이지: 빈 영역 (좌우 균형 유지용 w-10 placeholder)
```

---

## 6.2 TabBar

```
[고정 레이어: fixed top-14 w-full h-12 bg-white border-b z-20]
[숨김 조건: /post/:id, /write, /verify, /mypage]

레이아웃: flex

탭 아이템 (각 flex-1):
  - 아이콘 + 텍스트 (flex-col items-center justify-center)
  - 커뮤니티 → /
  - 지도      → /map

active 스타일:  text-blue-500, border-bottom 2px blue-500
inactive 스타일: text-gray-400
```

---

## 6.3 FloatingWriteButton (FAB)

```
[고정 레이어: fixed bottom-6 right-4 z-50]
[숨김 조건: /map, /post/:id, /write, /verify]

크기: w-14 h-14
스타일: rounded-full bg-blue-500 shadow-lg
내용: + 아이콘 (흰색)
```

---

# 7. 페이지별 UI 프레임

---

## 7.1 커뮤니티 페이지 (`/`)

```
[전체: flex-col, padding-top: 104px, padding-bottom: 96px]

┌─────────────────────────────┐  ← Header (fixed)
│  로고          커뮤니티  👤  │
├─────────────────────────────┤  ← TabBar (fixed)
│  [커뮤니티]      지도        │
├─────────────────────────────┤
│ [전체][자유][질문][정보]…   │  ← CategoryFilter (스크롤 고정 아님, 콘텐츠 일부)
├─────────────────────────────┤
│                    최신순 ▾  │  ← SortDropdown
├─────────────────────────────┤
│  [PostCard]                  │
│  [PostCard]                  │  ← PostList (스크롤 영역)
│  [PostCard]                  │
│  ...                         │
└─────────────────────────────┘
                          [＋]    ← FAB (fixed)
```

**컴포넌트 트리**

```
<CommunityPage>
  <CategoryFilter />
  <SortDropdown />
  <PostList>
    <PostCard />
    ...
  </PostList>
</CommunityPage>
```

---

## 7.2 지도 페이지 (`/map`)

```
[전체: flex-col, height: 100vh, padding-top: 104px]
[FAB 없음 / ApartmentPanel이 하단 점유]

┌─────────────────────────────┐  ← Header (fixed)
│  로고            지도    👤  │
├─────────────────────────────┤  ← TabBar (fixed)
│   커뮤니티     [지도]        │
├─────────────────────────────┤
│                              │
│                              │
│       MapView                │  ← flex-1, 지도 영역 (스크롤 없음)
│      [마커] [마커]            │
│                              │
├─────────────────────────────┤
│  ─────── (핸들바)            │
│  아파트 이름                  │  ← ApartmentPanel
│  주소                        │    (fixed bottom 또는 flex 하단 고정)
│  최근 게시글 미리보기 3개      │
│  [더보기]        [글쓰기]     │
└─────────────────────────────┘
```

> ⚠️ **[수정]** `/map` 페이지는 일반 스크롤 구조가 아닌 **flex 전체 높이 분할 구조**.
> - MapView: `flex-1 overflow-hidden`
> - ApartmentPanel: 고정 높이 또는 min-h 지정 (예: min-h-[200px])
> - 전체 페이지: `h-full flex flex-col overflow-hidden` (바깥 스크롤 차단)

**컴포넌트 트리**

```
<MapPage>                        ← h-full flex flex-col overflow-hidden
  <MapView />                    ← flex-1 overflow-hidden
  <ApartmentPanel />             ← 고정 하단 영역
</MapPage>
```

---

## 7.3 게시글 상세 (`/post/:id`)

```
[전체: flex-col, padding-top: 56px, padding-bottom: 72px]
[TabBar 없음 / CommentInput fixed bottom]

┌─────────────────────────────┐  ← Header (fixed)
│  ←    게시글                 │
├─────────────────────────────┤
│  [카테고리]                  │
│  제목                        │  ← PostContent
│  아파트명_닉네임  3시간 전    │
│  본문 내용...                │
│                              │
│        [❤️ 좋아요]            │  ← LikeButton
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│  댓글 N개                    │
│  [CommentItem]               │  ← CommentList (스크롤 영역)
│  [CommentItem]               │
├─────────────────────────────┤
│  댓글 입력...         [전송]  │  ← CommentInput (fixed bottom, z-40)
└─────────────────────────────┘
```

**컴포넌트 트리**

```
<PostDetailPage>                 ← flex-col, overflow-y-auto
  <PostContent />
  <LikeButton />
  <CommentList>
    <CommentItem />
    ...
  </CommentList>
  <CommentInput />               ← fixed bottom-0, z-40
</PostDetailPage>
```

---

## 7.4 글 작성 (`/write`)

```
[전체: flex-col, padding-top: 56px, padding-bottom: 24px]
[TabBar 없음 / FAB 없음]

┌─────────────────────────────┐  ← Header (fixed)
│  ←    글 작성                │
├─────────────────────────────┤
│  잠실엘스 주민으로 글 작성 중 │  ← ApartmentInfo (읽기 전용 배너)
├─────────────────────────────┤
│  [자유][질문][정보][민원][거래]│  ← CategorySelect
├─────────────────────────────┤
│  제목 입력                   │  ← TitleInput
│                       0/50   │
├─────────────────────────────┤
│                              │
│  내용 입력                   │  ← ContentTextarea (min-h: 200px)
│                              │
├─────────────────────────────┤
│         [등록하기]            │  ← SubmitButton (w-full)
└─────────────────────────────┘
```

**컴포넌트 트리**

```
<WritePage>                      ← flex-col, overflow-y-auto
  <ApartmentInfo />
  <CategorySelect />
  <TitleInput />
  <ContentTextarea />
  <SubmitButton />
</WritePage>
```

---

## 7.5 거주지 인증 (`/verify`)

```
[전체: flex-col, padding-top: 56px, padding-bottom: 24px]
[TabBar 없음 / FAB 없음]

┌─────────────────────────────┐  ← Header (fixed)
│  ←    거주지 인증             │
├─────────────────────────────┤
│  🔍 아파트명 또는 주소 검색   │  ← SearchInput
├─────────────────────────────┤
│  [ApartmentListItem]         │
│  [ApartmentListItem]         │  ← ApartmentList (스크롤 영역)
│  [ApartmentListItem]         │
│  ...                         │
└─────────────────────────────┘
```

**컴포넌트 트리**

```
<VerifyPage>                     ← flex-col
  <SearchInput />                ← sticky top (검색창은 스크롤 시 고정)
  <ApartmentList>
    <ApartmentListItem />
    ...
  </ApartmentList>
</VerifyPage>
```

> ⚠️ **[추가]** SearchInput은 `sticky top-0`으로 처리 권장.
> fixed 사용 시 Header(z-30)와 z-index 충돌 가능. sticky가 안전.

---

## 7.6 마이페이지 (`/mypage`)

```
[전체: flex-col, padding-top: 56px, padding-bottom: 96px]
[TabBar 없음 / FAB 있음]

┌─────────────────────────────┐  ← Header (fixed)
│  로고          마이페이지 👤 │
├─────────────────────────────┤
│  닉네임                      │
│  아파트명 · 인증완료 ✓        │  ← UserInfoCard
├─────────────────────────────┤
│  [내 게시글]    [내 댓글]     │  ← TabMenu (sticky top-14)
├─────────────────────────────┤
│  [PostCard or CommentItem]   │
│  [PostCard or CommentItem]   │  ← 탭에 따라 리스트 전환 (스크롤 영역)
│  ...                         │
├─────────────────────────────┤
│  [로그아웃]                   │  ← LogoutButton
└─────────────────────────────┘
                          [＋]    ← FAB (fixed)
```

> ⚠️ **[추가]** MyPage 내부 TabMenu는 `sticky`로 처리.
> `/mypage`는 TabBar가 없으므로 `sticky top-14(56px)` 기준.

**컴포넌트 트리**

```
<MyPage>                         ← flex-col, overflow-y-auto
  <UserInfoCard />
  <TabMenu />                    ← sticky top-14
  <MyPostList /> or <MyCommentList />
  <LogoutButton />
</MyPage>
```

---

# 8. 화면 전환 프레임 흐름

```
[/] ─────────────────────────────────────────────────────────
  PostCard 클릭 → /post/:id
    - Header: 로고+타이틀 → ←+타이틀 (뒤로가기 패턴)
    - TabBar: 표시 → 숨김
    - FAB: 표시 → 숨김
    - CommentInput: 없음 → fixed bottom 등장

[/] ─────────────────────────────────────────────────────────
  FAB 클릭 (VERIFIED) → /write
    - Header: 로고+타이틀 → ←+타이틀
    - TabBar: 표시 → 숨김
    - FAB: 표시 → 숨김

[/] → [Header 우측 👤] ──────────────────────────────────────
  → /mypage
    - Header: 타이틀만 변경
    - TabBar: 표시 → 숨김
    - FAB: 표시 → 유지 (mypage에서 FAB 표시)

[/map] ───────────────────────────────────────────────────────
  마커 클릭 → ApartmentPanel 내용 변경 (페이지 전환 없음)
  [글쓰기] 클릭 → /write (VERIFIED) or /verify (UNVERIFIED)
```

---

# 9. 스크롤 영역 명세

| 페이지 | 스크롤 방식 | 스크롤 영역 |
|--------|------------|------------|
| / | 일반 수직 스크롤 | PostList 전체 |
| /map | 스크롤 없음 | MapView + ApartmentPanel 고정 분할 |
| /post/:id | 일반 수직 스크롤 | PostContent + CommentList |
| /write | 일반 수직 스크롤 | 폼 전체 |
| /verify | 일반 수직 스크롤 | ApartmentList (SearchInput은 sticky) |
| /mypage | 일반 수직 스크롤 | 리스트 영역 (TabMenu는 sticky) |

---

# 10. 컴포넌트 파일 구조

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   └── Skeleton.tsx
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   └── FloatingWriteButton.tsx
│   └── features/
│       ├── community/
│       │   ├── CategoryFilter.tsx
│       │   ├── SortDropdown.tsx
│       │   ├── PostList.tsx
│       │   └── PostCard.tsx
│       ├── post/
│       │   ├── PostContent.tsx
│       │   ├── LikeButton.tsx
│       │   ├── CommentList.tsx
│       │   ├── CommentItem.tsx
│       │   └── CommentInput.tsx
│       ├── map/
│       │   ├── MapView.tsx
│       │   └── ApartmentPanel.tsx
│       ├── verify/
│       │   ├── ApartmentList.tsx
│       │   └── ApartmentListItem.tsx
│       └── mypage/
│           ├── UserInfoCard.tsx
│           ├── TabMenu.tsx
│           ├── MyPostList.tsx
│           └── MyCommentList.tsx
├── pages/
│   ├── CommunityPage.tsx
│   ├── MapPage.tsx
│   ├── PostDetailPage.tsx
│   ├── WritePage.tsx
│   ├── VerifyPage.tsx
│   └── MyPage.tsx
├── stores/
│   ├── userStore.ts
│   ├── postStore.ts
│   └── uiStore.ts
├── types/
│   └── index.ts
├── data/
│   └── mockData.ts
└── router/
    ├── index.tsx
    └── ProtectedRoute.tsx
```

---

# 11. 디자인 토큰

## 11.1 고정 치수

```
Header 높이:       56px  (h-14)
TabBar 높이:       48px  (h-12)
FAB 크기:          56px  (w-14 h-14)
FAB 위치:          bottom-6 right-4
CommentInput 높이: 56px  (h-14)
```

## 11.2 색상

```
primary:       blue-500   (#3B82F6)
primaryHover:  blue-600
background:    gray-50
surface:       white
border:        gray-200
textPrimary:   gray-900
textSecondary: gray-500
```

## 11.3 타이포그래피

```
페이지 타이틀: text-lg font-bold
카드 제목:    text-base font-semibold
본문:         text-sm text-gray-700
메타:         text-xs text-gray-400
```

## 11.4 공통 스타일

```
카드:          bg-white rounded-xl shadow-sm p-4
버튼 primary:  bg-blue-500 text-white rounded-lg px-4 py-2
버튼 secondary:border border-gray-200 text-gray-700 rounded-lg px-4 py-2
Badge:         rounded-full text-xs px-2 py-0.5 font-medium
```

---

# 12. 반응형

```
모바일 기준 설계 (Mobile First)
max-width: 768px / margin: 0 auto
```

---

# 13. 최종 생성 요구사항

아래 조건을 만족하는 React UI 프레임을 생성하라.

1. **모든 페이지 구현** — 6개 페이지 (`/`, `/map`, `/post/:id`, `/write`, `/verify`, `/mypage`)
2. **레이아웃 레이어** — 섹션 4 명세 기준으로 z-index, fixed/sticky 적용
3. **padding-top / padding-bottom** — 섹션 4.3, 4.4 수치 정확히 적용
4. **고정 요소 표시 조건** — 섹션 4.2 테이블 기준으로 조건부 렌더링
5. **컴포넌트 트리** — 섹션 7 각 페이지 트리 구조 준수
6. **스크롤 영역** — 섹션 9 명세 준수 (`/map`은 스크롤 없는 flex 분할)
7. **Tailwind 스타일** — 섹션 11 디자인 토큰 기반
8. **Mock 데이터** — 정적 렌더링 가능한 최소 mock 포함
9. **모바일 우선** — max-width 768px
