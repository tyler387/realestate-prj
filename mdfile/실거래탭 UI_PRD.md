# 📄 UI PRD — 실거래 탭 (Real Transaction Tab)
## v2.0 | 검증 완료 | 바이브 코딩용

> **범위**: 실거래 탭 단독 명세. 기존 UI PRD (frame v4)에 병합하여 사용.
> **기술 스택**: 기존과 동일 (React 18+ / TypeScript / Tailwind CSS / React Router v6 / Zustand)
>
> **v2 검증 변경 요약**:
> - `/trade/search` 에서 TabBar 숨김 누락 → 수정
> - `/trade/apartment/:id` padding-top 미명세 → 추가
> - `TradeTypeFilter` 상태가 전역(uiStore)인지 로컬인지 불명확 → 로컬 state로 확정
> - `PriceChart` 타입별(매매/전세) 분리 여부 미명세 → 추가
> - `TradeHistoryList` 에 EmptyState 누락 → 추가
> - `ApartmentSearchItem` 에서 `apartmentId` 참조 오류 → props 타입 수정
> - `월세` TradeRecord 의 `price` 필드 의미 모호 (보증금인지 월세인지) → 필드명 분리
> - `formatPrice` 엣지케이스 누락 (0원, 9999만원 이하) → 보완
> - `RecentSearchList` 전체 삭제 버튼 누락 → 추가
> - Header 타이틀 `/trade/search` 진입 경로 2가지 (랭킹 → 검색 / 검색 → 상세) 미분리 → navigate(-1) 통일 확정

---

# 1. TabBar 변경

## 기존 → 변경

```
기존: [커뮤니티]  [지도]
변경: [커뮤니티]  [실거래]  [지도]
```

## TabBar 명세

```
탭 3개 (각 flex-1):
  커뮤니티  →  /
  실거래    →  /trade
  지도      →  /map

아이콘:
  커뮤니티: 말풍선 아이콘
  실거래:   그래프/차트 아이콘
  지도:     위치핀 아이콘

active:   text-blue-500, border-bottom 2px blue-500
inactive: text-gray-400
```

---

# 2. 고정 요소 표시 조건 (전체 앱 기준 업데이트)

| 요소 | / | /trade | /map | /post/:id | /write | /verify | /mypage | /trade/search | /trade/apartment/:id |
|------|:-:|:------:|:----:|:---------:|:------:|:-------:|:-------:|:-------------:|:--------------------:|
| Header | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TabBar | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| FAB    | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

> ⚠️ **[수정]** v1에서 `/trade/search`, `/trade/apartment/:id` 의 TabBar 조건 미명세 → 두 페이지 모두 TabBar **숨김**

---

# 3. padding-top / padding-bottom 전체 업데이트

| 페이지 | padding-top | padding-bottom | 비고 |
|--------|-------------|----------------|------|
| / | 104px | 96px | Header+TabBar / FAB |
| /trade | 104px | 96px | Header+TabBar / 여유 |
| /map | 104px | 0 | flex 분할 구조 |
| /post/:id | 56px | 72px | Header만 / CommentInput |
| /write | 56px | 24px | Header만 |
| /verify | 56px | 24px | Header만 |
| /mypage | 56px | 96px | Header만 / FAB |
| /trade/search | 56px | 24px | Header만, TabBar 없음 |
| /trade/apartment/:id | 56px | 24px | Header만, TabBar 없음 |

---

# 4. 라우팅 추가

```
/trade                    → 실거래 메인 (기간별 랭킹 피드)
/trade/search             → 아파트 검색
/trade/apartment/:id      → 아파트 실거래 상세
```

## Header 타이틀 매핑 추가

```
/trade                 → "실거래"        패턴: 로고 + 타이틀 + 👤
/trade/search          → "아파트 검색"   패턴: ← + 타이틀 (우측 빈 w-10)
/trade/apartment/:id   → {아파트명}      패턴: ← + 동적 타이틀 (우측 빈 w-10)
```

---

# 5. 실거래 메인 페이지 (`/trade`)

## 화면 레이아웃

```
┌─────────────────────────────┐  ← Header (fixed, z-30)
│  로고          실거래    👤  │
├─────────────────────────────┤  ← TabBar (fixed, z-20)
│  커뮤니티   [실거래]   지도  │
├─────────────────────────────┤  padding-top: 104px
│  🔍 아파트명으로 검색         │  ← TradeSearchBar (클릭 시 /trade/search)
├─────────────────────────────┤
│  [오늘]  [1주일]  [1개월]    │  ← PeriodFilter
├─────────────────────────────┤
│  🔥 실거래 많은 아파트 TOP 20 │  ← 섹션 타이틀 (text-sm font-bold text-gray-500)
│                              │
│  [TradeRankingCard]  1위     │
│  [TradeRankingCard]  2위     │  ← TradeRankingList (스크롤)
│  [TradeRankingCard]  3위     │
│  ...                         │
└─────────────────────────────┘
```

## 컴포넌트 트리

```
<TradePage>                      ← flex-col, overflow-y-auto, pt-[104px]
  <TradeSearchBar />
  <PeriodFilter />
  <SectionTitle>실거래 많은 아파트 TOP 20</SectionTitle>
  <TradeRankingList>
    <TradeRankingCard />
    ...
  </TradeRankingList>
</TradePage>
```

## 5.1 TradeSearchBar

```
역할: 검색 진입점 (실제 input 아님, 버튼처럼 동작)

스타일:
  mx-4 my-3
  bg-gray-100 rounded-xl px-4 py-3
  flex items-center gap-2

내용:
  🔍 아이콘 (text-gray-400)
  "아파트명으로 검색" 텍스트 (text-gray-400 text-sm)

동작:
  클릭 전체 영역 → navigate('/trade/search')
```

## 5.2 PeriodFilter

```ts
// 로컬 상태 또는 uiStore.tradePeriod
type Period = '1d' | '1w' | '1m'

기본값: '1m' (1개월)

구성: 버튼 3개 (하나만 선택 가능)
  '1d' → "오늘"
  '1w' → "1주일"
  '1m' → "1개월"

레이아웃: flex gap-2 px-4 py-2

스타일:
  selected:   bg-blue-500 text-white rounded-full px-4 py-1.5 text-sm font-medium
  unselected: bg-gray-100 text-gray-500 rounded-full px-4 py-1.5 text-sm
```

## 5.3 TradeRankingList

```ts
type TradeRankingListProps = {
  period: Period
  rankings: TradeRanking[]
  isLoading: boolean          // ← 로딩 상태 (Skeleton 표시용)
}

동작:
  isLoading=true  → TradeRankingCardSkeleton 5개 표시
  rankings 변경   → 리스트 갱신 (period 변경 시 트리거)
  최대 20개 표시
```

## 5.4 TradeRankingCard

```ts
type TradeRanking = {
  rank: number
  apartmentId: number
  apartmentName: string
  address: string
  tradeCount: number          // 해당 기간 거래 건수
  latestPrice: number         // 최근 매매 거래가 (만원)
  priceChange: number         // 직전 기간 대비 가격 변동 (만원, 양수/음수)
  priceChangeRate: number     // 변동률 (%)
}

레이아웃: flex items-center gap-3 p-4

  [순위] [아파트 정보 (flex-1)] [거래 통계]

순위 영역 (w-8 text-center):
  1~3위: text-xl font-bold text-blue-500
  4위~:  text-base font-bold text-gray-400

아파트 정보 영역:
  아파트 이름   text-base font-semibold text-gray-900
  주소          text-xs text-gray-400 mt-0.5
  최근 거래가   text-sm text-gray-700 mt-1  → formatPrice() 적용

거래 통계 영역 (text-right):
  거래 건수     text-base font-bold text-blue-500  "{N}건"
  가격 변동     text-xs mt-0.5
    상승: text-red-500  "▲ {X.X}%"
    하락: text-blue-400 "▼ {X.X}%"
    없음: text-gray-400 "─"

카드 전체 스타일:
  bg-white rounded-xl shadow-sm mb-2 mx-4
  1~3위: border-l-4 border-blue-500

클릭: navigate(`/trade/apartment/${rank.apartmentId}`)
```

---

# 6. 검색 페이지 (`/trade/search`)

## 화면 레이아웃

```
┌─────────────────────────────┐  ← Header (fixed, z-30)
│  ←    아파트 검색             │
├─────────────────────────────┤  padding-top: 56px (TabBar 없음)
│  🔍 [아파트명 입력...   ] ✕  │  ← SearchInput (sticky top-14, z-20)
├─────────────────────────────┤
│                              │
│  ── 검색어 입력 전 ──         │
│                              │
│  최근 검색       [전체삭제]   │  ← RecentSearchList
│  잠실엘스                ✕   │
│  헬리오시티              ✕   │
│                              │
│  ── 검색어 입력 후 ──         │
│                              │
│  검색 결과 (N개)              │  ← SearchResultList
│  [ApartmentSearchItem]       │
│  [ApartmentSearchItem]       │
│                              │
│  ── 결과 없을 때 ──           │
│  [EmptyState]                │
└─────────────────────────────┘
```

## 컴포넌트 트리

```
<TradeSearchPage>                ← flex-col, pt-[56px]
  <SearchInput />                ← sticky top-14, z-20, bg-white
  
  {query === '' &&
    <RecentSearchList />
  }
  {query !== '' && results.length > 0 &&
    <SearchResultList>
      <ApartmentSearchItem />
      ...
    </SearchResultList>
  }
  {query !== '' && results.length === 0 &&
    <EmptyState icon="🔍" title="검색 결과가 없어요" />
  }
</TradeSearchPage>
```

## 6.1 SearchInput

```
위치: sticky top-14 (Header 56px 바로 아래), z-20, bg-white
      ← TabBar가 없는 페이지이므로 top-14 기준

구성:
  좌측: 🔍 아이콘
  중앙: input (flex-1, autofocus, placeholder="아파트명으로 검색")
  우측: ✕ 버튼 (query 있을 때만 표시)

동작:
  autofocus: true (페이지 진입 즉시 키보드 올라옴)
  onChange: query 상태 업데이트 → 실시간 필터링
  ✕ 클릭: query 초기화
  빈 query 상태에서 ← 뒤로가기: navigate(-1)
```

## 6.2 RecentSearchList

```
표시 조건: query === '' 일 때만 표시

구성:
  헤더: "최근 검색" (text-sm font-bold) + [전체삭제] 버튼 (text-xs text-gray-400)
  항목 최대 5개:
    검색어 텍스트 (flex-1)
    ✕ 삭제 버튼 (개별 삭제)

동작:
  항목 클릭 → query에 해당 검색어 세팅 → 검색 실행
  ✕ 클릭   → 해당 항목 삭제
  전체삭제  → 전체 초기화

저장: localStorage key = 'recentTradeSearch'
      저장 시점: ApartmentSearchItem 클릭 시 (검색어 추가)
```

## 6.3 ApartmentSearchItem

```ts
// ⚠️ [수정] v1에서 props에 apartmentId 직접 참조 오류 → apartment 객체 전체 전달로 수정

type ApartmentSearchItemProps = {
  apartment: Apartment        // Apartment 타입 전체
  onSelect: (apartment: Apartment) => void
}

구성:
  아파트 이름    font-semibold text-gray-900
  주소           text-xs text-gray-400 mt-0.5
  최근 실거래가  text-sm text-blue-500 mt-1  → formatPrice() 적용
  우측: > 아이콘 (text-gray-300)

동작:
  클릭 → onSelect(apartment) 호출
       → 최근 검색어에 apartmentName 추가 (localStorage)
       → navigate(`/trade/apartment/${apartment.apartmentId}`)

스타일:
  flex items-center px-4 py-3 border-b border-gray-100
```

---

# 7. 아파트 실거래 상세 (`/trade/apartment/:id`)

## 화면 레이아웃

```
┌─────────────────────────────┐  ← Header (fixed, z-30)
│  ←    잠실엘스               │  ← 동적 타이틀
├─────────────────────────────┤  padding-top: 56px
│  잠실엘스                    │
│  서울 송파구 잠실동           │
│  23억 5,000만                │  ← ApartmentHeader
│  ▲ 2.2% 전월 대비            │
│                      [☆ 관심]│
├─────────────────────────────┤
│  [전체] [매매] [전세] [월세]  │  ← TradeTypeFilter (sticky top-14)
├─────────────────────────────┤
│  ┌────────────────────────┐  │
│  │  📈 월별 평균 시세       │  │  ← PriceChart
│  │  (선택된 타입 기준)      │  │
│  └────────────────────────┘  │
├─────────────────────────────┤
│  최근 실거래 내역             │
│  [TradeHistoryItem]          │
│  [TradeHistoryItem]          │  ← TradeHistoryList
│  [TradeHistoryItem]          │
│  [EmptyState]                │  ← 해당 타입 거래 없을 때
└─────────────────────────────┘
```

## 컴포넌트 트리

```
<ApartmentTradePage>             ← flex-col, overflow-y-auto, pt-[56px]
  <ApartmentHeader />
  <TradeTypeFilter />            ← sticky top-14, z-20, bg-white
  <PriceChart />                 ← selectedType 연동
  <SectionTitle>최근 실거래 내역</SectionTitle>
  <TradeHistoryList>
    <TradeHistoryItem />
    ...
  </TradeHistoryList>
  <EmptyState />                 ← 결과 없을 때
</ApartmentTradePage>
```

## 7.1 ApartmentHeader

```ts
type ApartmentHeaderProps = {
  apartment: Apartment
  latestPrice: number         // 최근 매매 실거래가 (만원)
  priceChangeMan: number      // 전월 대비 변동 (만원)
  priceChangeRate: number     // 변동률 (%)
  isFavorite: boolean
  onFavoriteToggle: () => void
}

레이아웃: bg-white px-4 py-5 relative

구성:
  아파트 이름        text-xl font-bold text-gray-900
  주소               text-sm text-gray-500 mt-1
  최근 실거래가      text-2xl font-bold text-gray-900 mt-3  → formatPrice()
  가격 변동 (매매 기준):
    상승: text-red-500  "▲ {X.X}% 전월 대비"
    하락: text-blue-400 "▼ {X.X}% 전월 대비"
    없음: text-gray-400 "전월 대비 변동 없음"
  [☆ / ★ 관심] 버튼: absolute top-5 right-4
    비활성: ☆ text-gray-400
    활성:   ★ text-yellow-400
```

## 7.2 TradeTypeFilter

```ts
// ⚠️ [수정] 전역 uiStore 대신 로컬 useState로 관리
// 페이지 벗어나면 초기화되는 것이 자연스러운 UX

type TradeType = 'all' | '매매' | '전세' | '월세'
// 기본값: 'all'

위치: sticky top-14, z-20, bg-white
      border-b border-gray-200

레이아웃: flex (각 flex-1 text-center)

스타일:
  selected:   text-blue-500 font-semibold, border-bottom 2px blue-500
  unselected: text-gray-400 font-normal
  높이: h-12 (48px)
```

## 7.3 PriceChart

```ts
// ⚠️ [수정] TradeTypeFilter 선택값에 따라 표시 데이터 분리

type PriceChartProps = {
  data: PriceHistory[]
  tradeType: TradeType      // 선택된 타입에 맞는 데이터 표시
}

type PriceHistory = {
  month: string             // "25.03" 형식
  avgPrice: number          // 평균 거래가 (만원)
  tradeType: '매매' | '전세' | '월세'
}

mock 구현:
  SVG 기반 꺾은선 그래프
  viewBox: "0 0 {width} 120"
  X축: 월 레이블 (6개월치만 표시 — 12개 다 쓰면 레이블 겹침)
  Y축: 가격 범위 자동 계산 (min~max 기준)
  라인: polyline stroke="blue-500" strokeWidth="2"
  포인트: circle r="3" fill="blue-500"
  hover/touch: 해당 포인트 위에 가격 툴팁

스타일: bg-white rounded-xl mx-4 my-3 p-4
높이: h-40 (160px) 고정

tradeType = 'all' → 매매 데이터 기준으로 표시 (가장 대표성 있음)
```

## 7.4 TradeHistoryList / TradeHistoryItem

```ts
// ⚠️ [수정] 월세의 price 필드 의미 모호 → deposit(보증금) / monthlyRent(월세) 분리

type TradeRecord = {
  id: number
  apartmentId: number
  buildingName?: string       // 동 이름 (예: "101동")
  floor: string               // 층 (예: "15층")
  area: number                // 전용면적 (㎡)
  tradeType: '매매' | '전세' | '월세'
  price: number               // 매매가 또는 전세 보증금 (만원)
  deposit?: number            // 월세 보증금 (만원) — tradeType='월세' 일 때
  monthlyRent?: number        // 월 임대료 (만원) — tradeType='월세' 일 때
  contractDate: string        // 계약일 (예: "2025.03.15")
}

// 가격 표시 규칙:
//   매매: formatPrice(price)
//   전세: formatPrice(price)
//   월세: formatPrice(deposit) + " / 월 " + monthlyRent + "만"

TradeHistoryItem 레이아웃:
  px-4 py-3 border-b border-gray-100

  상단 행: [거래유형 Badge]          계약일 (text-xs text-gray-400, 우측)
  중단 행: 가격 (text-base font-bold text-gray-900)
  하단 행: {buildingName} · 전용 {area}㎡ · {floor} (text-xs text-gray-400)

Badge:
  매매: bg-red-50   text-red-500   rounded-full px-2 py-0.5 text-xs
  전세: bg-blue-50  text-blue-500  rounded-full px-2 py-0.5 text-xs
  월세: bg-green-50 text-green-500 rounded-full px-2 py-0.5 text-xs

필터링:
  TradeTypeFilter = 'all'  → 전체 표시
  그 외             → 해당 tradeType만 표시

EmptyState (결과 없을 때):
  icon: "📭"
  title: "해당 유형의 거래 내역이 없어요"
```

---

# 8. 상태 관리

## uiStore 추가

```ts
// uiStore에만 추가 (전역 유지 필요한 것)
tradePeriod: '1d' | '1w' | '1m'   // 기본값: '1m'
setTradePeriod: (p: '1d' | '1w' | '1m') => void
```

## 로컬 state (페이지 내 useState)

```ts
// TradeSearchPage
const [query, setQuery] = useState('')
const [results, setResults] = useState<Apartment[]>([])

// ApartmentTradePage
const [selectedType, setSelectedType] = useState<TradeType>('all')
const [isFavorite, setIsFavorite] = useState(false)
```

> 관심 아파트는 현재 mock이므로 로컬 state로 처리.
> 추후 기능 PRD에서 persist 방식 결정.

---

# 9. Mock 데이터 (`mockTradeData.ts`)

## 9.1 TradeRanking (기간별 분리)

```ts
export const mockTradeRankings: Record<'1d' | '1w' | '1m', TradeRanking[]> = {
  '1d': [
    { rank: 1, apartmentId: 1, apartmentName: "잠실엘스",       address: "서울 송파구", tradeCount: 3,  latestPrice: 235000, priceChange: 5000,  priceChangeRate: 2.2  },
    { rank: 2, apartmentId: 2, apartmentName: "헬리오시티",      address: "서울 송파구", tradeCount: 2,  latestPrice: 198000, priceChange: -3000, priceChangeRate: -1.5 },
    { rank: 3, apartmentId: 3, apartmentName: "래미안퍼스티지",  address: "서울 서초구", tradeCount: 2,  latestPrice: 410000, priceChange: 0,     priceChangeRate: 0    },
    { rank: 4, apartmentId: 4, apartmentName: "아크로리버파크",  address: "서울 서초구", tradeCount: 1,  latestPrice: 520000, priceChange: 10000, priceChangeRate: 1.9  },
    { rank: 5, apartmentId: 5, apartmentName: "마포래미안푸르지오", address: "서울 마포구", tradeCount: 1, latestPrice: 135000, priceChange: -1000, priceChangeRate: -0.7 },
  ],
  '1w': [
    { rank: 1, apartmentId: 2, apartmentName: "헬리오시티",      address: "서울 송파구", tradeCount: 18, latestPrice: 198000, priceChange: -3000, priceChangeRate: -1.5 },
    { rank: 2, apartmentId: 1, apartmentName: "잠실엘스",        address: "서울 송파구", tradeCount: 15, latestPrice: 235000, priceChange: 5000,  priceChangeRate: 2.2  },
    { rank: 3, apartmentId: 5, apartmentName: "마포래미안푸르지오", address: "서울 마포구", tradeCount: 12, latestPrice: 135000, priceChange: -1000, priceChangeRate: -0.7 },
    { rank: 4, apartmentId: 3, apartmentName: "래미안퍼스티지",  address: "서울 서초구", tradeCount: 10, latestPrice: 410000, priceChange: 0,     priceChangeRate: 0    },
    { rank: 5, apartmentId: 4, apartmentName: "아크로리버파크",  address: "서울 서초구", tradeCount: 8,  latestPrice: 520000, priceChange: 10000, priceChangeRate: 1.9  },
  ],
  '1m': [
    { rank: 1, apartmentId: 2, apartmentName: "헬리오시티",      address: "서울 송파구", tradeCount: 52, latestPrice: 198000, priceChange: -3000, priceChangeRate: -1.5 },
    { rank: 2, apartmentId: 1, apartmentName: "잠실엘스",        address: "서울 송파구", tradeCount: 48, latestPrice: 235000, priceChange: 5000,  priceChangeRate: 2.2  },
    { rank: 3, apartmentId: 5, apartmentName: "마포래미안푸르지오", address: "서울 마포구", tradeCount: 39, latestPrice: 135000, priceChange: -1000, priceChangeRate: -0.7 },
    { rank: 4, apartmentId: 3, apartmentName: "래미안퍼스티지",  address: "서울 서초구", tradeCount: 31, latestPrice: 410000, priceChange: 0,     priceChangeRate: 0    },
    { rank: 5, apartmentId: 4, apartmentName: "아크로리버파크",  address: "서울 서초구", tradeCount: 24, latestPrice: 520000, priceChange: 10000, priceChangeRate: 1.9  },
  ],
}
```

## 9.2 TradeRecord (아파트별, 타입별 분리)

```ts
export const mockTradeRecords: TradeRecord[] = [
  // 잠실엘스 (apartmentId: 1) — 매매
  { id: 1,  apartmentId: 1, buildingName: "101동", floor: "15층", area: 84.9, tradeType: "매매", price: 235000,                        contractDate: "2025.03.28" },
  { id: 2,  apartmentId: 1, buildingName: "102동", floor: "8층",  area: 84.9, tradeType: "매매", price: 231000,                        contractDate: "2025.03.15" },
  { id: 3,  apartmentId: 1, buildingName: "103동", floor: "22층", area: 114.9,tradeType: "매매", price: 310000,                        contractDate: "2025.03.10" },
  // 잠실엘스 (apartmentId: 1) — 전세
  { id: 4,  apartmentId: 1, buildingName: "101동", floor: "7층",  area: 59.9, tradeType: "전세", price: 80000,                         contractDate: "2025.03.25" },
  { id: 5,  apartmentId: 1, buildingName: "104동", floor: "12층", area: 84.9, tradeType: "전세", price: 110000,                        contractDate: "2025.03.18" },
  // 잠실엘스 (apartmentId: 1) — 월세
  { id: 6,  apartmentId: 1, buildingName: "102동", floor: "3층",  area: 59.9, tradeType: "월세", price: 0, deposit: 50000, monthlyRent: 120, contractDate: "2025.03.20" },
]
```

## 9.3 PriceHistory (타입별 분리)

```ts
export const mockPriceHistory: PriceHistory[] = [
  // 잠실엘스 매매 (apartmentId: 1)
  { month: "24.04", avgPrice: 218000, tradeType: "매매" },
  { month: "24.05", avgPrice: 221000, tradeType: "매매" },
  { month: "24.06", avgPrice: 219000, tradeType: "매매" },
  { month: "24.07", avgPrice: 225000, tradeType: "매매" },
  { month: "24.08", avgPrice: 228000, tradeType: "매매" },
  { month: "24.09", avgPrice: 224000, tradeType: "매매" },
  { month: "24.10", avgPrice: 229000, tradeType: "매매" },
  { month: "24.11", avgPrice: 231000, tradeType: "매매" },
  { month: "24.12", avgPrice: 230000, tradeType: "매매" },
  { month: "25.01", avgPrice: 233000, tradeType: "매매" },
  { month: "25.02", avgPrice: 232000, tradeType: "매매" },
  { month: "25.03", avgPrice: 235000, tradeType: "매매" },
  // 잠실엘스 전세
  { month: "24.04", avgPrice: 76000,  tradeType: "전세" },
  { month: "24.05", avgPrice: 77000,  tradeType: "전세" },
  { month: "24.06", avgPrice: 76500,  tradeType: "전세" },
  { month: "24.07", avgPrice: 78000,  tradeType: "전세" },
  { month: "24.08", avgPrice: 79000,  tradeType: "전세" },
  { month: "24.09", avgPrice: 78500,  tradeType: "전세" },
  { month: "24.10", avgPrice: 79500,  tradeType: "전세" },
  { month: "24.11", avgPrice: 80000,  tradeType: "전세" },
  { month: "24.12", avgPrice: 80000,  tradeType: "전세" },
  { month: "25.01", avgPrice: 81000,  tradeType: "전세" },
  { month: "25.02", avgPrice: 80500,  tradeType: "전세" },
  { month: "25.03", avgPrice: 82000,  tradeType: "전세" },
]
// 단위: 만원
```

---

# 10. 가격 포맷 유틸 (`utils/format.ts`)

```ts
// ⚠️ [수정] v1 엣지케이스 보완: 0원, 9999만 이하, 정확히 N억

export const formatPrice = (price: number): string => {
  if (price <= 0) return "정보 없음"

  const eok = Math.floor(price / 10000)
  const man = price % 10000

  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`
  if (eok > 0)             return `${eok}억`
  return `${man.toLocaleString()}만`
}

// 예시:
// formatPrice(235000) → "23억 5,000만"
// formatPrice(80000)  → "8억"
// formatPrice(5000)   → "5,000만"
// formatPrice(9500)   → "9,500만"
// formatPrice(0)      → "정보 없음"

export const formatPriceShort = (price: number): string => {
  // 랭킹 카드 등 공간이 좁은 곳에서 사용
  if (price <= 0) return "-"
  const eok = Math.floor(price / 10000)
  const man = Math.round((price % 10000) / 1000)  // 천만 단위 반올림
  if (eok > 0 && man > 0) return `${eok}.${man}억`
  if (eok > 0)             return `${eok}억`
  return `${price / 1000}천만`
}
// 예시:
// formatPriceShort(235000) → "23.5억"
// formatPriceShort(80000)  → "8억"
// formatPriceShort(9500)   → "9.5천만"  ← 9500만원
```

---

# 11. 컴포넌트 파일 구조

```
src/
├── components/
│   └── features/
│       └── trade/
│           ├── TradeSearchBar.tsx          ← /trade 검색창 (버튼형)
│           ├── PeriodFilter.tsx            ← 기간 필터 토글
│           ├── TradeRankingList.tsx        ← 랭킹 리스트 + Skeleton
│           ├── TradeRankingCard.tsx        ← 랭킹 카드 단위
│           ├── TradeRankingCardSkeleton.tsx← 로딩용 Skeleton
│           ├── RecentSearchList.tsx        ← 최근 검색어 목록
│           ├── ApartmentSearchItem.tsx     ← 검색 결과 항목
│           ├── ApartmentHeader.tsx         ← 상세 상단 정보
│           ├── TradeTypeFilter.tsx         ← 매매/전세/월세 탭
│           ├── PriceChart.tsx              ← SVG 꺾은선 차트
│           ├── TradeHistoryList.tsx        ← 실거래 내역 리스트
│           └── TradeHistoryItem.tsx        ← 실거래 내역 단위
├── pages/
│   ├── TradePage.tsx
│   ├── TradeSearchPage.tsx
│   └── ApartmentTradePage.tsx
├── data/
│   └── mockTradeData.ts
└── utils/
    └── format.ts                           ← formatPrice, formatPriceShort
```

---

# 12. 화면 전환 흐름

```
[/trade]
  TradeSearchBar 클릭   → navigate('/trade/search')
  TradeRankingCard 클릭 → navigate('/trade/apartment/:id')

[/trade/search]
  뒤로가기(←)           → navigate(-1)  →  /trade 복귀
  ApartmentSearchItem   → navigate('/trade/apartment/:id')

[/trade/apartment/:id]
  뒤로가기(←)           → navigate(-1)  →  /trade 또는 /trade/search 복귀
  TradeTypeFilter 전환  → 로컬 state 변경 (페이지 이동 없음)
  관심 토글             → 로컬 state 변경 (페이지 이동 없음)
```

---

# 13. 스크롤 영역 명세

| 페이지 | 스크롤 방식 | sticky 요소 |
|--------|------------|------------|
| /trade | 수직 스크롤 전체 | 없음 |
| /trade/search | 수직 스크롤 (리스트) | SearchInput (top-14) |
| /trade/apartment/:id | 수직 스크롤 전체 | TradeTypeFilter (top-14) |

---

# 14. 최종 생성 요구사항

아래 조건을 만족하는 실거래 탭 React UI를 생성하라.

1. **라우팅 3개** — `/trade`, `/trade/search`, `/trade/apartment/:id`
2. **TabBar 3탭** — 커뮤니티 / 실거래 / 지도, 순서 고정
3. **고정 요소 조건** — 섹션 2 테이블 기준 엄수 (`/trade/search`, `/trade/apartment/:id` 에서 TabBar 숨김)
4. **padding-top/bottom** — 섹션 3 수치 기준 적용
5. **랭킹 피드** — PeriodFilter 3개, mock 데이터 기간별 분리, Skeleton 포함
6. **검색 페이지** — autofocus, 실시간 필터링, RecentSearchList(전체삭제 포함), EmptyState
7. **상세 페이지** — ApartmentHeader + TradeTypeFilter(sticky) + PriceChart(SVG, 타입별) + TradeHistoryList(EmptyState 포함)
8. **상태 분리** — tradePeriod만 uiStore / TradeType·isFavorite은 로컬 useState
9. **가격 포맷** — `formatPrice` / `formatPriceShort` 유틸 적용, 엣지케이스 처리
10. **Mock 데이터** — `mockTradeData.ts` 에서 기간별·타입별·아파트별 분리 관리
11. **Tailwind 스타일** — 기존 디자인 토큰 유지 (blue-500 / gray-50 / rounded-xl)
12. **모바일 우선** — max-width 768px
