# 📄 실거래 탭 사이드 UI PRD
## v3.0 | 검증 완료 | AI Agent 구현용

> **범위**: 실거래 탭(`/trade`) 좌/우 사이드바
> **연관 PRD**: UI Frame v4 / 실거래 탭 v2 / 커뮤니티 사이드바 v3
>
> **v3 검증 변경 요약**:
> - `TradeLeftSidebar` props 불일치 (정의는 없는데 전달은 있음) → props 제거, store 직접 구독
> - `TopTransactionApartments` 빈 상태 + isLoading 순서 버그 → 렌더링 조건 재정렬
> - `useTradeFilterStore.getState()` 컴포넌트 내부 사용 → `useTradeFilterStore()` 훅으로 교체
> - `initialData` + `period` 동적 파라미터 타이밍 이슈 → `placeholderData` 패턴으로 수정
> - aptId 필터 배너 위치 미명세 → TradeSearchBar 아래 명확히 지정
> - `priceRange` / `dealType` / `areaRange` 필터 실제 적용 위치 미명세 → 명세 추가
> - `HighestPriceDeals` isLoading/isEmpty/isError 렌더링 순서 버그 → 순서 확정

---

# 1. 개요

## 목적

실거래 탭에서 단순 거래 리스트 이상의 가치를 제공:

- 가격 흐름 해석
- 거래 트렌드 제공
- 빠른 필터링
- 관심 데이터 클릭 유도

## 적용 범위

**데스크탑 전용** (1024px 이상). 1023px 이하 숨김.

---

# 2. 기존 PRD와 연관 관계

| 항목 | 기존 실거래 PRD v2 | 이 PRD |
|------|:-----------------:|:------:|
| 라우팅 | `/trade`, `/trade/search`, `/trade/apartment/:id` | 변경 없음 |
| 가격 단위 | 만원 | 만원 (통일) |
| formatPrice | `utils/format.ts` | 재사용 |
| React Query | `useSidebarData.ts` 패턴 | 동일 패턴 |
| sticky top | 커뮤니티 사이드바 v3 기준 | 동일 기준 |
| 브레이크포인트 | 1024px | 동일 |

---

# 3. 레이아웃 구조

## 3.1 3컬럼 구성

```
┌──────────────────────────────────────────────────────┐  Header (fixed, z-30, h-14)
├──────────────────────────────────────────────────────┤  TabBar (fixed, z-20, h-12)
│                                                      │
│  [TradeLeftSidebar]  [ TradePage Main ]  [TradeRightSidebar] │
│       260px            max-w-[768px]          260px          │
│    lg:block only         flex-1 min-w-0    lg:block only     │
└──────────────────────────────────────────────────────┘
```

## 3.2 AppLayout 연동

커뮤니티 사이드바 v3의 `AppLayout.tsx`에 아래 조건 추가.

```tsx
// AppLayout.tsx (기존 showLeftSidebar/showRightSidebar에 추가)

const { pathname } = useLocation()

// 기존 커뮤니티
const showCommLeftSidebar  = pathname === '/'
const showCommRightSidebar = pathname === '/' || pathname.startsWith('/post/')

// 실거래 추가
const showTradeLeftSidebar  = pathname === '/trade'
const showTradeRightSidebar = pathname === '/trade'

// aside 내부 컴포넌트 분기
// LeftSidebar aside 내부:
{showCommLeftSidebar  && <CommLeftSidebar  aptId={aptId} />}
{showTradeLeftSidebar && <TradeLeftSidebar />}

// RightSidebar aside 내부:
{showCommRightSidebar  && <CommRightSidebar  aptId={aptId} />}
{showTradeRightSidebar && <TradeRightSidebar />}
```

> ⚠️ **[수정]** v2에서 aside 자체를 조건부로 두 쌍 렌더링하면
> 같은 위치에 aside가 2개 생길 수 있음.
> aside는 좌/우 각 1개씩 유지하고, 내부 컴포넌트만 pathname에 따라 분기.

## 3.3 사이드바 표시 페이지

| 페이지 | TradeLeftSidebar | TradeRightSidebar |
|--------|:----------------:|:-----------------:|
| /trade | ✅ | ✅ |
| /trade/search | ❌ | ❌ |
| /trade/apartment/:id | ❌ | ❌ |

## 3.4 sticky top

```
/trade: Header(56) + TabBar(48) = top-[104px]
```

aside 구조 (커뮤니티 사이드바 v3과 동일):

```tsx
<aside className="hidden lg:block w-[260px] flex-shrink-0 pt-4 pr-4
                  sticky top-[104px] self-start h-fit">
  {/* 내부 컴포넌트 분기 */}
</aside>
```

---

# 4. 전역 상태 — TradeFilterStore

기존 `uiStore`와 충돌 방지를 위해 **별도 store**로 분리.

```ts
// stores/tradeFilterStore.ts

type PriceRange = 'UNDER_10' | '10_20' | 'OVER_20' | null
type DealType   = 'SALE' | 'JEONSE' | 'MONTHLY' | null
type AreaRange  = '20' | '30' | '40' | null

type TradeFilterState = {
  regionId:    string
  subRegionId: string | null
  aptId:       string | null

  priceRange:  PriceRange
  dealType:    DealType
  areaRange:   AreaRange

  setRegion:     (regionId: string, subRegionId?: string) => void
  setAptId:      (aptId: string | null) => void
  setPriceRange: (range: PriceRange) => void
  setDealType:   (type: DealType) => void
  setAreaRange:  (area: AreaRange) => void
  resetFilters:  () => void
}

export const useTradeFilterStore = create<TradeFilterState>((set) => ({
  regionId:    'seoul-songpa',
  subRegionId: null,
  aptId:       null,
  priceRange:  null,
  dealType:    null,
  areaRange:   null,

  setRegion:     (regionId, subRegionId = null) => set({ regionId, subRegionId }),
  setAptId:      (aptId) => set({ aptId }),

  // aptId는 다른 필터 변경 시 자동 초기화
  setPriceRange: (priceRange) => set({ priceRange, aptId: null }),
  setDealType:   (dealType)   => set({ dealType,   aptId: null }),
  setAreaRange:  (areaRange)  => set({ areaRange,  aptId: null }),

  resetFilters:  () => set({
    aptId: null, priceRange: null, dealType: null, areaRange: null
  }),
}))
```

## QuickFilters 상태 초기화 시점

```
1. /trade 진입: 이전 필터 유지 (의도적 — 뒤로가기 후 재진입 시 유지)
2. 다른 필터 변경 시: aptId만 자동 초기화 (setPriceRange 등 내부 처리)
3. [필터 초기화] 클릭: resetFilters() — priceRange/dealType/areaRange/aptId 전부 null
```

## URL Query Sync

mock 단계에서는 Zustand store만으로 동작. URL Query 동기화는 실제 API 연동 시 적용.

---

# 5. 가격 단위 및 포맷

모든 가격 데이터는 **만원 단위**. `formatPrice()` 유틸 재사용.

```ts
formatPrice(235000)  // → "23억 5,000만"
formatPrice(100000)  // → "10억"
formatPrice(90000)   // → "9,000만"
```

mock 데이터 단위 기준:
```
240000  = 24억
195000  = 19억 5천만
100000  = 10억
```

---

# 6. 변동률 색상 컨벤션

한국 부동산 서비스 표준 (호갱노노 등):

```ts
changeRate > 0: text-red-500   "▲ {X.X}%"   // 상승 = 빨간색
changeRate < 0: text-blue-400  "▼ {X.X}%"   // 하락 = 파란색
changeRate = 0: text-gray-400  "─"           // 보합
```

---

# 7. LeftSidebar — TradeLeftSidebar

> ⚠️ **[수정]** v2에서 `TradeLeftSidebar`가 `filters`, `onFilterChange` props를 받도록 aside에서 전달했지만
> 컴포넌트 정의에는 props가 없었음. 불일치.
> 각 자식 컴포넌트가 `useTradeFilterStore()`를 직접 구독하는 방식으로 통일.

```tsx
// components/layout/TradeLeftSidebar.tsx
export const TradeLeftSidebar = () => (
  <div>
    <PriceTrendSummary />
    <QuickFilters />
  </div>
)
// props 없음 — 내부 컴포넌트가 store 직접 구독
```

---

## 7.1 PriceTrendSummary

### 화면 구성

```
┌──────────────────────────┐
│  📊 가격 흐름              │  ← CardTitle
│  [1주일]  [1개월]          │  ← PeriodToggle (로컬 state)
│                           │
│  평균 거래가               │  ← text-xs text-gray-400
│  23억 5,000만              │  ← text-xl font-bold text-gray-900
│  ▲ 2.3%   거래 18건        │  ← ChangeRateBadge + 거래건수
└──────────────────────────┘
```

### 타입

```ts
type PriceTrendData = {
  period: '1w' | '1m'
  avgPrice: number          // 만원
  changeRate: number        // % (양수: 상승, 음수: 하락)
  transactionCount: number
}
```

### Mock 데이터

```ts
export const mockPriceTrend: Record<'1w' | '1m', PriceTrendData> = {
  '1w': { period: '1w', avgPrice: 235000, changeRate: 2.3,  transactionCount: 18 },
  '1m': { period: '1m', avgPrice: 228000, changeRate: -1.2, transactionCount: 72 },
}
```

### 상태

```ts
// period: 로컬 state (카드 내부에서만 사용, tradeFilterStore에 넣지 않음)
const [period, setPeriod] = useState<'1w' | '1m'>('1w')

// regionId, subRegionId: tradeFilterStore에서 읽음
const { regionId, subRegionId } = useTradeFilterStore()
```

### hooks

> ⚠️ **[수정]** v2에서 `initialData: USE_MOCK ? mockPriceTrend[period] : undefined` 사용 시
> period가 바뀌어도 최초 렌더링 시점의 initialData가 React Query 캐시에 고정되는 타이밍 이슈 발생.
> **`placeholderData`** 로 교체 — 새 데이터 로딩 중에 이전 데이터 표시, 캐시에는 영향 없음.

```ts
export const usePriceTrend = (
  regionId: string,
  subRegionId: string | null,
  period: '1w' | '1m'
) => {
  return useQuery({
    queryKey: ['trade', 'priceTrend', regionId, subRegionId, period],
    queryFn: () =>
      fetch(`/api/transactions/trend?regionId=${regionId}&period=${period}`)
        .then(r => r.json()),
    enabled: !USE_MOCK,
    placeholderData: USE_MOCK ? mockPriceTrend[period] : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
}
```

### 예외 처리

```
transactionCount === 0: "최근 거래 데이터가 없어요" (text-sm text-gray-400), changeRate 숨김
transactionCount === 1: changeRate 숨김, "거래 1건"만 표시
```

### 컴포넌트 트리 (렌더링 순서 확정)

```tsx
export const PriceTrendSummary = () => {
  const [period, setPeriod] = useState<'1w' | '1m'>('1w')
  const { regionId, subRegionId } = useTradeFilterStore()
  const { data, isLoading, isError } = usePriceTrend(regionId, subRegionId, period)

  return (
    <SidebarCard>
      <CardTitle>📊 가격 흐름</CardTitle>
      <PeriodToggle value={period} onChange={setPeriod} />

      {/* 렌더링 우선순위: isLoading → isError → data */}
      {isLoading && <PriceTrendSkeleton />}
      {!isLoading && isError && (
        <ErrorMessage text="데이터를 불러올 수 없습니다" />
      )}
      {!isLoading && !isError && data && (
        <>
          {data.transactionCount === 0 ? (
            <ErrorMessage text="최근 거래 데이터가 없어요" />
          ) : (
            <>
              <p className="text-xs text-gray-400 mt-3">평균 거래가</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {formatPrice(data.avgPrice)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {data.transactionCount > 1 && (
                  <ChangeRateBadge rate={data.changeRate} />
                )}
                <span className="text-xs text-gray-400">
                  거래 {data.transactionCount}건
                </span>
              </div>
            </>
          )}
        </>
      )}
    </SidebarCard>
  )
}
```

---

## 7.2 QuickFilters

### 화면 구성

```
┌──────────────────────────┐
│  🏷 빠른 필터              │  ← CardTitle
│                           │
│  가격대                   │  ← FilterGroup 레이블 (text-xs text-gray-500)
│  [~10억] [10~20억] [20억+] │
│                           │
│  거래 유형                 │
│  [매매] [전세] [월세]      │
│                           │
│  면적                     │
│  [20평대] [30평대] [40평대]│
│                           │
│              [필터 초기화]  │  ← text-xs text-gray-400, 우측 정렬
└──────────────────────────┘
```

### 필터 옵션

```ts
const PRICE_RANGE_OPTIONS = [
  { label: '~10억',   value: 'UNDER_10' },   // price < 100000 (만원)
  { label: '10~20억', value: '10_20'    },   // 100000 <= price <= 200000
  { label: '20억+',   value: 'OVER_20'  },   // price > 200000
] as const

const DEAL_TYPE_OPTIONS = [
  { label: '매매', value: 'SALE'    },
  { label: '전세', value: 'JEONSE' },
  { label: '월세', value: 'MONTHLY' },
] as const

const AREA_RANGE_OPTIONS = [
  { label: '20평대', value: '20' },   // 59㎡ 이상 82㎡ 미만
  { label: '30평대', value: '30' },   // 82㎡ 이상 115㎡ 미만
  { label: '40평대', value: '40' },   // 115㎡ 이상
] as const
```

### 컴포넌트 트리

```tsx
export const QuickFilters = () => {
  // store 직접 구독
  const {
    priceRange, dealType, areaRange,
    setPriceRange, setDealType, setAreaRange, resetFilters
  } = useTradeFilterStore()

  return (
    <SidebarCard>
      <CardTitle>🏷 빠른 필터</CardTitle>

      <FilterGroup label="가격대">
        {PRICE_RANGE_OPTIONS.map(opt => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            isSelected={priceRange === opt.value}
            onClick={() => setPriceRange(priceRange === opt.value ? null : opt.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="거래 유형">
        {DEAL_TYPE_OPTIONS.map(opt => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            isSelected={dealType === opt.value}
            onClick={() => setDealType(dealType === opt.value ? null : opt.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="면적">
        {AREA_RANGE_OPTIONS.map(opt => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            isSelected={areaRange === opt.value}
            onClick={() => setAreaRange(areaRange === opt.value ? null : opt.value)}
          />
        ))}
      </FilterGroup>

      <button
        onClick={resetFilters}
        className="text-xs text-gray-400 mt-3 ml-auto block hover:text-gray-600 transition-colors"
      >
        필터 초기화
      </button>
    </SidebarCard>
  )
}
```

### Chip 스타일

```
기본:   bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs cursor-pointer hover:bg-gray-200
선택됨: bg-blue-500 text-white   rounded-full px-3 py-1 text-xs cursor-pointer
FilterGroup 레이블: text-xs font-medium text-gray-500 mt-3 mb-1.5 first:mt-0
```

---

# 8. RightSidebar — TradeRightSidebar

```tsx
// components/layout/TradeRightSidebar.tsx
export const TradeRightSidebar = () => (
  <div>
    <HighestPriceDeals />
    <TopTransactionApartments />
  </div>
)
// props 없음 — 내부 컴포넌트가 store 직접 구독
```

---

## 8.1 HighestPriceDeals

### 화면 구성

```
┌──────────────────────────┐
│  🔥 신고가 거래            │  ← CardTitle
│                           │
│  [신고가] 잠실엘스          │  ← badge + 아파트명(truncate)
│  84.9㎡  24억              │  ← 면적 + 가격(formatPrice)
│  2026.04.08               │  ← 계약일 (text-xs text-gray-400)
│  ─────────────────────   │
│  [신고가] 헬리오시티        │
│  59.9㎡  19억 5,000만      │
└──────────────────────────┘
```

### 타입

```ts
type HighestPriceDeal = {
  aptId: string
  aptName: string
  price: number       // 만원
  dealDate: string    // "2026-04-08"
  area: number        // ㎡ (숫자)
  isNewHigh: boolean
}
```

### Mock 데이터

```ts
export const mockHighestPriceDeals: HighestPriceDeal[] = [
  { aptId: 'apt-001', aptName: '잠실엘스',       price: 240000, dealDate: '2026-04-08', area: 84.9,  isNewHigh: true  },
  { aptId: 'apt-002', aptName: '헬리오시티',      price: 195000, dealDate: '2026-04-05', area: 59.9,  isNewHigh: true  },
  { aptId: 'apt-003', aptName: '래미안퍼스티지',  price: 415000, dealDate: '2026-04-03', area: 114.9, isNewHigh: false },
]
```

### API

```
GET /api/transactions/highest?regionId={regionId}&subRegionId={subRegionId}
```

### hooks

```ts
export const useHighestPriceDeals = (regionId: string, subRegionId: string | null) => {
  return useQuery({
    queryKey: ['trade', 'highestDeals', regionId, subRegionId],
    queryFn: () =>
      fetch(`/api/transactions/highest?regionId=${regionId}`)
        .then(r => r.json()),
    enabled: !USE_MOCK,
    placeholderData: USE_MOCK ? mockHighestPriceDeals : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
}
```

### 컴포넌트 트리 (렌더링 순서 확정)

> ⚠️ **[수정]** v2에서 `{isLoading && ...}`, `{isError && ...}`, `{data?.length === 0 && ...}`를
> 동시에 나열하면 isError 상태에서 data가 빈 배열이면 두 조건이 동시에 true가 될 수 있음.
> **isLoading → isError → isEmpty → data** 순서로 명확하게 분기.

```tsx
export const HighestPriceDeals = () => {
  const { regionId, subRegionId, setAptId } = useTradeFilterStore()
  const { data, isLoading, isError } = useHighestPriceDeals(regionId, subRegionId)

  return (
    <SidebarCard>
      <CardTitle>🔥 신고가 거래</CardTitle>

      {isLoading && <PostListSkeleton />}

      {!isLoading && isError && (
        <ErrorMessage text="데이터를 불러올 수 없습니다" />
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <ErrorMessage text="신고가 없음" />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        data.map(deal => (
          <HighestDealItem
            key={`${deal.aptId}-${deal.dealDate}`}
            deal={deal}
            onClick={() => setAptId(deal.aptId)}
          />
        ))
      )}
    </SidebarCard>
  )
}
```

> ⚠️ **[수정]** v2에서 `useTradeFilterStore.getState().setAptId(aptId)` 사용.
> 컴포넌트 내부에서는 반드시 `useTradeFilterStore()` 훅으로 구독해야 함.
> `.getState()`는 React 렌더링 사이클 외부(이벤트 핸들러/유틸 함수)에서만 사용.

### HighestDealItem

```tsx
const HighestDealItem = ({
  deal,
  onClick,
}: {
  deal: HighestPriceDeal
  onClick: () => void
}) => (
  <div
    onClick={onClick}
    className="py-2 border-b border-gray-100 last:border-b-0
               cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded transition-colors"
  >
    <div className="flex items-center gap-1.5 mb-0.5">
      {deal.isNewHigh && (
        <span className="text-xs bg-red-50 text-red-500 rounded px-1.5 py-0.5 font-medium flex-shrink-0">
          신고가
        </span>
      )}
      <span className="text-sm font-semibold text-gray-900 truncate">
        {deal.aptName}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 flex-shrink-0">{deal.area}㎡</span>
      <span className="text-sm font-bold text-gray-900">{formatPrice(deal.price)}</span>
    </div>
    <p className="text-xs text-gray-400 mt-0.5">{deal.dealDate}</p>
  </div>
)
```

---

## 8.2 TopTransactionApartments

### 화면 구성

```
┌──────────────────────────┐
│  🏆 거래량 TOP5            │  ← CardTitle
│                           │
│  1  헬리오시티     18건    │
│  2  잠실엘스       15건    │
│  3  래미안퍼스티지  12건    │
│  4  아크로리버파크   8건    │
│  5  마포래미안       7건   │
└──────────────────────────┘
```

### 타입

```ts
type TopTransactionApartment = {
  rank: number
  aptId: string
  aptName: string
  transactionCount: number
}
```

### Mock 데이터

```ts
export const mockTopTransactionApartments: TopTransactionApartment[] = [
  { rank: 1, aptId: 'apt-002', aptName: '헬리오시티',         transactionCount: 18 },
  { rank: 2, aptId: 'apt-001', aptName: '잠실엘스',           transactionCount: 15 },
  { rank: 3, aptId: 'apt-003', aptName: '래미안퍼스티지',     transactionCount: 12 },
  { rank: 4, aptId: 'apt-004', aptName: '아크로리버파크',     transactionCount: 8  },
  { rank: 5, aptId: 'apt-005', aptName: '마포래미안푸르지오', transactionCount: 7  },
]
```

### API

```
GET /api/transactions/top-apartments?regionId={regionId}&subRegionId={subRegionId}
```

기간: 최근 7일 기준

### hooks

```ts
export const useTopTransactionApartments = (regionId: string, subRegionId: string | null) => {
  return useQuery({
    queryKey: ['trade', 'topApartments', regionId, subRegionId],
    queryFn: () =>
      fetch(`/api/transactions/top-apartments?regionId=${regionId}`)
        .then(r => r.json()),
    enabled: !USE_MOCK,
    placeholderData: USE_MOCK ? mockTopTransactionApartments : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })
}
```

### 컴포넌트 트리 (렌더링 순서 확정)

> ⚠️ **[수정]** v2에서 `{data && data.length > 0 && (<SidebarCard>..{isLoading}..)}` 구조는
> isLoading일 때 data가 없어 SidebarCard 자체가 안 뜨므로 Skeleton이 표시되지 않음.
> isLoading 체크를 SidebarCard 바깥에서 먼저.

```tsx
export const TopTransactionApartments = () => {
  const { regionId, subRegionId, setAptId } = useTradeFilterStore()
  const { data, isLoading, isError } = useTopTransactionApartments(regionId, subRegionId)

  // 빈 데이터 / 에러 시 카드 전체 숨김
  if (!isLoading && (isError || !data || data.length === 0)) return null

  return (
    <SidebarCard>
      <CardTitle>🏆 거래량 TOP5</CardTitle>

      {isLoading && <PostListSkeleton />}

      {!isLoading && data?.map(apt => (
        <TopAptItem
          key={apt.aptId}
          apt={apt}
          onClick={() => setAptId(apt.aptId)}
        />
      ))}
    </SidebarCard>
  )
}
```

### TopAptItem

```tsx
const TopAptItem = ({
  apt,
  onClick,
}: {
  apt: TopTransactionApartment
  onClick: () => void
}) => (
  <div
    onClick={onClick}
    className="flex items-center gap-2 py-2 border-b border-gray-100
               last:border-b-0 cursor-pointer hover:bg-gray-50
               -mx-1 px-1 rounded transition-colors"
  >
    <span className={`w-5 text-sm font-bold flex-shrink-0 text-center
      ${apt.rank <= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
      {apt.rank}
    </span>
    <span className="flex-1 text-sm text-gray-800 truncate min-w-0">
      {apt.aptName}
    </span>
    <span className="text-xs font-semibold text-blue-500 flex-shrink-0">
      {apt.transactionCount}건
    </span>
  </div>
)
```

---

# 9. TradePage — 필터 적용 및 배너

## 9.1 aptId 필터 배너 위치

> ⚠️ **[수정]** v2에서 위치 미명세. `TradeSearchBar` 바로 아래, `PeriodFilter` 바로 위에 렌더링.

```tsx
// pages/TradePage.tsx 레이아웃

<TradePage>
  <TradeSearchBar />             // 검색창

  {aptId && (                    // aptId 필터 배너 — TradeSearchBar 아래
    <AptFilterBanner
      aptName={getAptName(aptId)}
      onClear={() => setAptId(null)}
    />
  )}

  <PeriodFilter />               // 기간 필터
  <SectionTitle />               // "실거래 많은 아파트 TOP 20"
  <TradeRankingList />           // 랭킹 리스트
</TradePage>
```

### AptFilterBanner 컴포넌트

```tsx
const AptFilterBanner = ({
  aptName,
  onClear,
}: {
  aptName: string
  onClear: () => void
}) => (
  <div className="flex items-center justify-between mx-4 mt-2 px-3 py-2
                  bg-blue-50 rounded-lg border border-blue-100">
    <span className="text-sm text-blue-700">
      📍 {aptName} 필터 적용 중
    </span>
    <button
      onClick={onClear}
      className="text-xs text-blue-500 font-medium hover:text-blue-700 ml-2"
    >
      해제
    </button>
  </div>
)
```

## 9.2 필터 적용 위치 명세

> ⚠️ **[수정]** v2에서 `priceRange`, `dealType`, `areaRange` 필터가 어디서 어떻게 적용되는지 미명세.

| 필터 | 적용 위치 | 방식 |
|------|----------|------|
| `aptId` | `TradeRankingList` | 랭킹 카드 필터링 (aptId 일치만 표시) |
| `priceRange` | `TradeHistoryList` | `/trade/apartment/:id` 실거래 내역 필터링 |
| `dealType` | `TradeHistoryList` | 동일 |
| `areaRange` | `TradeHistoryList` | 동일 |

```ts
// TradeRankingList에서 aptId 필터 적용
const { aptId } = useTradeFilterStore()

const filtered = mockTradeRankings['1m'].filter(item =>
  aptId ? String(item.apartmentId) === aptId : true
)

// TradeHistoryList에서 나머지 필터 적용
const { priceRange, dealType, areaRange } = useTradeFilterStore()

const filtered = mockTradeRecords
  .filter(r => aptId ? r.aptId === aptId : true)
  .filter(r => {
    if (!priceRange) return true
    if (priceRange === 'UNDER_10') return r.price < 100000
    if (priceRange === '10_20')    return r.price >= 100000 && r.price <= 200000
    if (priceRange === 'OVER_20')  return r.price > 200000
    return true
  })
  .filter(r => {
    if (!dealType) return true
    const map = { SALE: '매매', JEONSE: '전세', MONTHLY: '월세' }
    return r.tradeType === map[dealType]
  })
  .filter(r => {
    if (!areaRange) return true
    if (areaRange === '20') return r.area >= 59  && r.area < 82
    if (areaRange === '30') return r.area >= 82  && r.area < 115
    if (areaRange === '40') return r.area >= 115
    return true
  })
```

---

# 10. Skeleton UI

```tsx
// components/sidebar/SidebarSkeleton.tsx (기존 파일에 추가)

// PriceTrendSummary Skeleton
export const PriceTrendSkeleton = () => (
  <div className="space-y-2 mt-3">
    <SkeletonBox className="h-3 w-1/2" />   {/* "평균 거래가" 레이블 */}
    <SkeletonBox className="h-6 w-3/4" />   {/* 가격 */}
    <SkeletonBox className="h-3 w-1/3" />   {/* 변동률 + 건수 */}
  </div>
)

// PostListSkeleton: 기존 SidebarSkeleton.tsx 그대로 재사용
// HighestPriceDeals(3행) / TopTransactionApartments(5행)에 적용
```

---

# 11. 에러 처리

| 컴포넌트 | isLoading | isError | isEmpty |
|---------|:---------:|:-------:|:-------:|
| PriceTrendSummary | Skeleton | "데이터를 불러올 수 없습니다" | "최근 거래 데이터가 없어요" |
| QuickFilters | 해당 없음 (정적) | 해당 없음 | 해당 없음 |
| HighestPriceDeals | Skeleton | "데이터를 불러올 수 없습니다" | "신고가 없음" |
| TopTransactionApartments | Skeleton | `return null` | `return null` |

---

# 12. 캐싱 전략

| 컴포넌트 | staleTime | gcTime | placeholderData |
|---------|-----------|--------|----------------|
| PriceTrendSummary | 5분 | 10분 | mockPriceTrend[period] |
| HighestPriceDeals | 5분 | 10분 | mockHighestPriceDeals |
| TopTransactionApartments | 5분 | 10분 | mockTopTransactionApartments |
| QuickFilters | 해당 없음 | — | — |

---

# 13. 컴포넌트 파일 구조

```
src/
├── components/
│   ├── layout/
│   │   ├── TradeLeftSidebar.tsx         ← 신규 (props 없음)
│   │   └── TradeRightSidebar.tsx        ← 신규 (props 없음)
│   └── features/
│       └── trade-sidebar/
│           ├── PriceTrendSummary.tsx
│           ├── PeriodToggle.tsx
│           ├── ChangeRateBadge.tsx      ← red/blue 분기 포함
│           ├── QuickFilters.tsx
│           ├── FilterGroup.tsx
│           ├── FilterChip.tsx
│           ├── HighestPriceDeals.tsx
│           ├── HighestDealItem.tsx
│           ├── TopTransactionApartments.tsx
│           ├── TopAptItem.tsx
│           └── AptFilterBanner.tsx      ← 신규 (TradePage에서 사용)
├── hooks/
│   └── useTradeSidebarData.ts
├── stores/
│   └── tradeFilterStore.ts
└── data/
    └── mockTradeSidebarData.ts
```

---

# 14. 디자인 토큰

```
공통 SidebarCard:     커뮤니티 사이드바 v3과 동일 (bg-white rounded-xl border border-gray-100 p-4 mb-4)

변동률 상승:           text-red-500  "▲ {X.X}%"
변동률 하락:           text-blue-400 "▼ {X.X}%"
변동률 보합:           text-gray-400 "─"

신고가 Badge:          bg-red-50 text-red-500 rounded px-1.5 py-0.5 text-xs font-medium

FilterChip 기본:       bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs
FilterChip 선택:       bg-blue-500 text-white   rounded-full px-3 py-1 text-xs
FilterGroup 레이블:    text-xs font-medium text-gray-500 mt-3 mb-1.5 first:mt-0

AptFilterBanner:       bg-blue-50 border border-blue-100 rounded-lg px-3 py-2
AptFilterBanner 텍스트: text-sm text-blue-700
AptFilterBanner 해제:   text-xs text-blue-500 font-medium

거래건수:              text-xs font-semibold text-blue-500
순위 1~3위:            text-blue-500 font-bold
순위 4~5위:            text-gray-400 font-bold
아파트명:              text-sm text-gray-800 truncate min-w-0
```

---

# 15. 최종 생성 요구사항

AI Agent는 아래 조건을 만족하는 실거래 사이드바 UI를 생성하라.

1. **AppLayout 연동** — 섹션 3.2 기준, aside 1쌍 유지하고 pathname에 따라 내부 컴포넌트 분기
2. **표시 페이지** — `/trade`만. `/trade/search`, `/trade/apartment/:id` 제외
3. **sticky top-[104px] + h-fit** — `/trade`는 TabBar 있음
4. **TradeLeftSidebar/RightSidebar props 없음** — 자식 컴포넌트가 store 직접 구독
5. **가격 단위 만원** — formatPrice 재사용, 원 단위 금지
6. **변동률 색상** — 상승 red-500 / 하락 blue-400 / 보합 gray-400
7. **tradeFilterStore 분리** — 섹션 4, 기존 uiStore와 별도 파일
8. **QuickFilters 토글** — 이미 선택 클릭 시 null, [필터 초기화] 포함, store 직접 구독
9. **aptId 연동** — setAptId()로 store 업데이트, `.getState()` 사용 금지 (훅으로)
10. **AptFilterBanner** — TradeSearchBar 아래 / PeriodFilter 위, 섹션 9.1 기준
11. **필터 적용 위치** — aptId → TradeRankingList / priceRange·dealType·areaRange → TradeHistoryList
12. **렌더링 순서** — isLoading → isError → isEmpty → data, 혼합 조건 사용 금지
13. **placeholderData** — initialData 대신 사용 (period 변경 타이밍 이슈 방지)
14. **TopTransactionApartments** — isLoading 중 SidebarCard 렌더링 후 Skeleton 표시
15. **Skeleton** — PriceTrendSkeleton(신규) + PostListSkeleton(재사용)
16. **에러/빈 상태** — 섹션 11 테이블 기준
17. **Mock 데이터** — `mockTradeSidebarData.ts`, 만원 단위
18. **공통 SidebarCard/ErrorMessage** — 커뮤니티 사이드바 v3 컴포넌트 공유
