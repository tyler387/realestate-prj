# 📄 사이드바 광고 시스템 PRD
## v3.0 | 검증 완료 | Spring + React 구현용

> **범위**: RightSidebar 광고 슬롯 — AdSlot 컴포넌트 + 노출/클릭 트래킹
> **연관 PRD**: UI Frame v4 / 커뮤니티 사이드바 v3 / 인증 PRD v2
>
> **v3 검증 변경 요약**:
> - `placeholderData` + `isLoading` 충돌 → Skeleton이 뜨지 않는 버그 → `initialData` 방식으로 교체
> - `selectWeightedAd()`가 useQuery 옵션 내부에서 매 렌더마다 실행 → `useMemo`로 분리
> - `hasTracked` ref와 ad 교체 useEffect 경쟁 조건 → 단일 useEffect로 통합
> - `AdFallback` 타입명과 컴포넌트명 충돌 → 타입명을 `AdFallbackContent`로 변경
> - `/post/:id` sticky top 미명세 → `top-[56px]` 분기 추가
> - `trackImpression` / `trackClick` export 누락 → export 추가
> - `aptId` 빈 문자열 처리 → API 파라미터에서 빈 문자열 제외 처리 추가

---

# 1. 개요

## 목적

우측 사이드바에 광고 영역을 도입하여 서비스 수익화 및 지역 기반 타겟 광고 제공.

- 광고 노출 (Impression) 트래킹
- 광고 클릭 (Click) 트래킹
- 지역/아파트 기반 타겟팅
- 광고 로테이션 (weight 기반)

## 적용 범위

**데스크탑 전용** (1024px 이상). RightSidebar가 표시되는 페이지에 한함.

---

# 2. 광고 표시 페이지

| 페이지 | AdSlot 표시 | sticky top |
|--------|:-----------:|-----------|
| / (커뮤니티) | ✅ | top-[104px] |
| /post/:id | ✅ | top-[56px] (TabBar 없음) |
| /trade | ❌ | — |
| 그 외 | ❌ | — |

> ⚠️ **[추가]** `/post/:id`는 TabBar가 없으므로 RightSidebar sticky top이 `top-[56px]`.
> AppLayout의 `sidebarStickyTop` 분기 로직(커뮤니티 사이드바 v3 섹션 3.4)과 동일 기준.
> LeftSidebar 광고 슬롯은 MVP에서 제외.

---

# 3. 광고 슬롯 정의

```ts
// types/ad.ts

export type AdSlotType = 'RIGHT_SIDEBAR_MIDDLE' | 'RIGHT_SIDEBAR_BOTTOM'
```

| Slot | 위치 |
|------|------|
| `RIGHT_SIDEBAR_MIDDLE` | MostCommentedPosts 아래 |
| `RIGHT_SIDEBAR_BOTTOM` | RightSidebar 최하단 |

---

# 4. 데이터 타입

```ts
// types/ad.ts

export type AdSlotType = 'RIGHT_SIDEBAR_MIDDLE' | 'RIGHT_SIDEBAR_BOTTOM'

export type Ad = {
  adId:        string
  slot:        AdSlotType
  title:       string
  description: string
  imageUrl:    string
  linkUrl:     string
  priority:    number
  weight:      number
}

// ⚠️ [수정] 타입명 AdFallback → AdFallbackContent (컴포넌트명 충돌 방지)
export type AdFallbackContent = {
  label:    string   // "실거래 정보 확인하기"
  linkPath: string   // "/trade"
}
```

---

# 5. RightSidebar 확정 구조

```tsx
// components/layout/RightSidebar.tsx

export const RightSidebar = ({ aptId }: { aptId: string }) => (
  <div>
    <PopularPosts aptId={aptId} />
    <MostCommentedPosts aptId={aptId} />
    <AdSlot slot="RIGHT_SIDEBAR_MIDDLE" />
    <AdSlot slot="RIGHT_SIDEBAR_BOTTOM" />
  </div>
)
```

---

# 6. React Query hook — useAd

> ⚠️ **[수정 핵심 1]** v2에서 `placeholderData` 사용 시
> React Query는 `isLoading = false`로 처리함.
> 즉, `placeholderData`가 있으면 Skeleton이 **절대 표시되지 않음**.
>
> 해결: `initialData` 방식으로 교체.
> `initialData`는 캐시에 초기값을 넣어주며 `isLoading`이 정상 동작.
> mock 모드에서는 `enabled: false` + `initialData`로 Skeleton 없이 즉시 렌더링.
> 실제 API 모드에서는 `enabled: true` + `initialData: undefined`로 정상 로딩 흐름.

> ⚠️ **[수정 핵심 2]** `selectWeightedAd()`를 `useQuery` 옵션 내부에 직접 쓰면
> 컴포넌트가 리렌더링될 때마다 새로운 광고가 랜덤 선택되어 광고가 계속 바뀜.
> `useMemo`로 한 번만 계산해서 `initialData`에 전달.

```ts
// hooks/useAdData.ts
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { mockAds, selectWeightedAd } from '../data/mockAdData'
import type { Ad, AdSlotType } from '../types/ad'

export const USE_MOCK_AD = true   // API 연동 전까지 true

export const useAd = (
  slot: AdSlotType,
  regionId: string,
  aptId: string
) => {
  // ⚠️ useMemo로 초기 랜덤 선택 1회 고정 (리렌더 시 재계산 방지)
  const mockAd = useMemo(
    () => selectWeightedAd(mockAds.filter(a => a.slot === slot)),
    [slot]   // slot이 바뀔 때만 재계산
  )

  return useQuery<Ad | null>({
    queryKey: ['ads', slot, regionId, aptId],
    queryFn:  () => {
      // aptId 빈 문자열 제외 처리
      const params = new URLSearchParams({ slot, regionId })
      if (aptId) params.append('aptId', aptId)

      return fetch(`/api/ads?${params.toString()}`)
        .then(r => r.json())
        .then(data => {
          if (!data.success) throw new Error(data.error?.message)
          return (data.data[0] ?? null) as Ad | null
        })
    },
    enabled:     !USE_MOCK_AD,
    initialData: USE_MOCK_AD ? mockAd : undefined,
    staleTime:   1000 * 60 * 10,
    gcTime:      1000 * 60 * 20,
  })
}
```

---

# 7. AdSlot 컴포넌트

## 7.1 props

```ts
type AdSlotProps = {
  slot: AdSlotType
}
```

> `regionId`, `aptId`는 컴포넌트 내부에서 `useUserStore()` 직접 구독.
> props로 전달하지 않음.

## 7.2 화면 구성

```
┌──────────────────────────┐
│  광고                     │  ← AdLabel (text-xs text-gray-400, 필수)
│  ┌────────────────────┐  │
│  │     광고 이미지      │  │  ← lazy loading img, h-[120px]
│  └────────────────────┘  │
│  잠실 부동산 상담           │  ← title (text-sm font-semibold)
│  수수료 할인 이벤트         │  ← description (text-xs text-gray-500)
└──────────────────────────┘
```

## 7.3 전체 컴포넌트

```tsx
// components/features/ads/AdSlot.tsx

export const AdSlot = ({ slot }: AdSlotProps) => {
  const { apartmentId } = useUserStore()

  const regionId = 'seoul-songpa'
  const aptId    = apartmentId ? String(apartmentId) : ''

  const { data: ad, isLoading, isError } = useAd(slot, regionId, aptId)

  // Impression 트래킹 — 단일 useEffect로 통합
  const adRef      = useRef<HTMLDivElement>(null)
  const hasTracked = useRef(false)

  // ⚠️ [수정] v2의 두 useEffect(observer + ad 교체 초기화) 를
  // 단일 useEffect로 통합. ad.adId가 바뀌면 observer 재생성 + hasTracked 초기화.
  useEffect(() => {
    if (!ad || !adRef.current) return

    hasTracked.current = false   // 새 광고 로드 시 초기화

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTracked.current) {
          hasTracked.current = true
          trackImpression(ad.adId, slot)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(adRef.current)
    return () => observer.disconnect()
  }, [ad?.adId, slot])   // adId가 바뀔 때만 재실행

  const handleClick = () => {
    if (!ad) return
    trackClick(ad.adId, slot)
    window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) return <AdSlotSkeleton />
  if (isError || !ad) return <AdFallback slot={slot} />

  return (
    <div
      ref={adRef}
      className="bg-white rounded-xl border border-gray-100 p-4 mb-4"
    >
      {/* 광고 라벨 — 법적 필수 표시 */}
      <p className="text-xs text-gray-400 mb-2">광고</p>

      <div onClick={handleClick} className="cursor-pointer group">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          loading="lazy"
          className="w-full h-[120px] object-cover rounded-lg mb-2
                     group-hover:opacity-90 transition-opacity"
        />
        <p className="text-sm font-semibold text-gray-900 truncate">
          {ad.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {ad.description}
        </p>
      </div>
    </div>
  )
}
```

---

# 8. AdFallback 컴포넌트

```tsx
// components/features/ads/AdFallback.tsx
// ⚠️ useNavigate는 Router 컨텍스트 내부에서만 동작.
// RightSidebar는 AppLayout > Router > Outlet 구조 안에 있으므로 정상 동작.

import { useNavigate } from 'react-router-dom'
import type { AdFallbackContent, AdSlotType } from '../../types/ad'

// 슬롯별 Fallback 콘텐츠
const FALLBACK_MAP: Record<AdSlotType, AdFallbackContent> = {
  RIGHT_SIDEBAR_MIDDLE: {
    label:    '실거래 정보 확인하기',
    linkPath: '/trade',
  },
  RIGHT_SIDEBAR_BOTTOM: {
    label:    '지도에서 아파트 찾기',
    linkPath: '/map',
  },
}

export const AdFallback = ({ slot }: { slot: AdSlotType }) => {
  const navigate   = useNavigate()
  const fallback   = FALLBACK_MAP[slot]
  const { apartmentName } = useUserStore()

  return (
    <div
      onClick={() => navigate(fallback.linkPath)}
      className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-4
                 cursor-pointer hover:bg-blue-100 transition-colors"
    >
      <p className="text-xs text-blue-400 mb-1">추천</p>
      <p className="text-sm font-semibold text-blue-700 truncate">
        {apartmentName
          ? `${apartmentName} ${fallback.label}`
          : fallback.label}
      </p>
      <p className="text-xs text-blue-500 mt-1">›</p>
    </div>
  )
}
```

---

# 9. 트래킹 유틸

```ts
// utils/adTracking.ts
// ⚠️ [수정] v2에서 export 누락 → export 추가

import type { AdSlotType } from '../types/ad'

export const trackImpression = async (
  adId: string,
  slot: AdSlotType
): Promise<void> => {
  try {
    await fetch('/api/ads/impression', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId,
        slot,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch {
    // fire-and-forget — 실패해도 UI 영향 없음
  }
}

export const trackClick = async (
  adId: string,
  slot: AdSlotType
): Promise<void> => {
  try {
    await fetch('/api/ads/click', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId,
        slot,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch {
    // fire-and-forget
  }
}
```

---

# 10. Mock 데이터

```ts
// data/mockAdData.ts

import type { Ad, AdSlotType } from '../types/ad'

export const USE_MOCK_AD = true

export const mockAds: Ad[] = [
  {
    adId:        'AD001',
    slot:        'RIGHT_SIDEBAR_MIDDLE',
    title:       '잠실 부동산 상담',
    description: '수수료 할인 이벤트 진행 중',
    imageUrl:    'https://placehold.co/220x120/EEF2FF/6366f1?text=AD',
    linkUrl:     'https://example.com/ad1',
    priority:    10,
    weight:      70,
  },
  {
    adId:        'AD002',
    slot:        'RIGHT_SIDEBAR_MIDDLE',
    title:       '송파 인테리어 전문점',
    description: '이사 후 인테리어 견적 받기',
    imageUrl:    'https://placehold.co/220x120/F0FDF4/22c55e?text=AD',
    linkUrl:     'https://example.com/ad2',
    priority:    8,
    weight:      30,
  },
  {
    adId:        'AD003',
    slot:        'RIGHT_SIDEBAR_BOTTOM',
    title:       '아파트 관리비 절약 팁',
    description: '에너지 절약 서비스 무료 신청',
    imageUrl:    'https://placehold.co/220x120/FFF7ED/f97316?text=AD',
    linkUrl:     'https://example.com/ad3',
    priority:    5,
    weight:      100,
  },
]

// weight 기반 랜덤 선택
// mock 단계 클라이언트 처리 / 실제 API: 서버에서 1개 반환
export const selectWeightedAd = (ads: Ad[]): Ad | null => {
  if (ads.length === 0) return null
  if (ads.length === 1) return ads[0]

  const total = ads.reduce((sum, ad) => sum + ad.weight, 0)
  let random  = Math.random() * total

  for (const ad of ads) {
    random -= ad.weight
    if (random <= 0) return ad
  }
  return ads[ads.length - 1]
}
```

---

# 11. Skeleton UI

```tsx
// components/features/ads/AdSlotSkeleton.tsx

export const AdSlotSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
    <div className="bg-gray-200 rounded animate-pulse h-3 w-8 mb-2" />
    <div className="bg-gray-200 rounded-lg animate-pulse h-[120px] w-full mb-2" />
    <div className="bg-gray-200 rounded animate-pulse h-3 w-3/4 mb-1" />
    <div className="bg-gray-200 rounded animate-pulse h-3 w-1/2" />
  </div>
)
```

> **mock 모드(`USE_MOCK_AD = true`)에서는 Skeleton이 표시되지 않음.**
> `initialData`가 즉시 주어지므로 `isLoading = false`.
> Skeleton은 실제 API 연동(`USE_MOCK_AD = false`) 시에만 표시됨.
> 이는 의도된 동작 — mock 단계에서는 즉시 광고 렌더링.

---

# 12. 에러 / 빈 상태 처리

| 상황 | 조건 | 처리 |
|------|------|------|
| mock 모드 로딩 | `USE_MOCK_AD = true` | Skeleton 없음, 즉시 광고 렌더링 |
| API 모드 로딩 | `isLoading = true` | `<AdSlotSkeleton />` |
| API 에러 | `isError = true` | `<AdFallback slot={slot} />` |
| 광고 없음 | `!ad` | `<AdFallback slot={slot} />` |
| Fallback 클릭 | — | `navigate(linkPath)` (내부 이동) |

> 빈 공간 절대 금지 — 항상 광고 또는 Fallback 중 하나 표시.

---

# 13. aptId 처리 정책

> ⚠️ **[추가]** GUEST/MEMBER는 `apartmentId = null` → `aptId = ''` → API 파라미터 제외.

```ts
// aptId가 빈 문자열이면 API 파라미터에서 제외
const params = new URLSearchParams({ slot, regionId })
if (aptId) params.append('aptId', aptId)

// 결과 URL:
// aptId 있음: /api/ads?slot=RIGHT_SIDEBAR_MIDDLE&regionId=seoul-songpa&aptId=APT001
// aptId 없음: /api/ads?slot=RIGHT_SIDEBAR_MIDDLE&regionId=seoul-songpa
```

> 서버는 `aptId` 없으면 `regionId` 기반 타겟 광고 반환.
> 서버가 타겟 광고도 없으면 빈 배열 반환 → 클라이언트 Fallback 처리.

---

# 14. 광고 노출 정책

## 우선순위 (서버 처리)

```
1. aptId 매칭 광고     (인증된 아파트 기반)
2. regionId 매칭 광고  (지역 기반)
3. 전체 광고 Fallback  (타겟 없음)
```

## Impression 중복 방지

```
단일 useEffect (ad?.adId 의존성):
  - ad.adId 변경 시: hasTracked.current = false 초기화 → observer 재생성
  - viewport 진입: hasTracked.current = true → trackImpression() → observer.disconnect()
  - 동일 adId 동안: 1회만 impression 보장
```

## weight 기반 선택 주체

```
mock 단계: selectWeightedAd() — 클라이언트, useMemo로 1회 고정
실제 API:  서버가 1개 반환 → data[0] 사용
```

---

# 15. API 명세 (Spring 연동 기준)

## 15.1 광고 조회

```
GET /api/ads?slot={slot}&regionId={regionId}[&aptId={aptId}]

Params:
  slot:     string (필수) — 'RIGHT_SIDEBAR_MIDDLE' | 'RIGHT_SIDEBAR_BOTTOM'
  regionId: string (필수) — 'seoul-songpa'
  aptId:    string (선택) — 없으면 regionId 기반 타겟팅

Response 200:
{
  "success": true,
  "data": [
    {
      "adId":        "AD123",
      "slot":        "RIGHT_SIDEBAR_MIDDLE",
      "title":       "잠실 부동산 상담",
      "description": "수수료 할인 이벤트",
      "imageUrl":    "https://...",
      "linkUrl":     "https://...",
      "priority":    10,
      "weight":      70
    }
  ],
  "error": null
}

비고:
  서버에서 weight 기반 1개만 반환 권장 (클라이언트는 data[0] 사용)
  광고 없으면 data: [] → 클라이언트 AdFallback 처리
```

## 15.2 노출 트래킹

```
POST /api/ads/impression

Body:
{
  "adId":      "AD123",
  "slot":      "RIGHT_SIDEBAR_MIDDLE",
  "timestamp": "2026-04-15T10:00:00.000Z"
}

Response: 200 OK
비고: 실패 무시 (fire-and-forget)
```

## 15.3 클릭 트래킹

```
POST /api/ads/click

Body:
{
  "adId":      "AD123",
  "slot":      "RIGHT_SIDEBAR_MIDDLE",
  "timestamp": "2026-04-15T10:00:00.000Z"
}

Response: 200 OK
```

---

# 16. 캐싱 전략

| 항목 | staleTime | gcTime | queryKey |
|------|-----------|--------|---------|
| 광고 조회 | 10분 | 20분 | `['ads', slot, regionId, aptId]` |

---

# 17. 성능 최적화

| 항목 | 적용 |
|------|------|
| 광고 이미지 | `<img loading="lazy" />` |
| 트래킹 API | 비동기 fire-and-forget, try-catch |
| 광고 조회 | React Query staleTime 10분 |
| IntersectionObserver | threshold 0.5, 1회 후 disconnect |
| 랜덤 선택 | `useMemo([slot])` — 슬롯 변경 시에만 재계산 |

---

# 18. 컴포넌트 파일 구조

```
src/
├── components/
│   ├── layout/
│   │   └── RightSidebar.tsx              ← AdSlot 추가
│   └── features/
│       └── ads/
│           ├── AdSlot.tsx                ← 메인 광고 컴포넌트
│           ├── AdFallback.tsx            ← 광고 없을 때 내부 추천
│           └── AdSlotSkeleton.tsx        ← 로딩 Skeleton (API 모드 전용)
├── hooks/
│   └── useAdData.ts                      ← useAd (React Query + useMemo)
├── utils/
│   └── adTracking.ts                     ← export trackImpression / trackClick
├── data/
│   └── mockAdData.ts                     ← mockAds + selectWeightedAd + USE_MOCK_AD
└── types/
    └── ad.ts                             ← Ad / AdSlotType / AdFallbackContent
```

---

# 19. 디자인 토큰

```
광고 카드:       bg-white rounded-xl border border-gray-100 p-4 mb-4
광고 라벨:       text-xs text-gray-400 mb-2   "광고"  (법적 필수)
광고 이미지:     w-full h-[120px] object-cover rounded-lg
광고 제목:       text-sm font-semibold text-gray-900 truncate
광고 설명:       text-xs text-gray-500 mt-0.5 truncate
hover 효과:      group-hover:opacity-90 transition-opacity

Fallback 카드:   bg-blue-50 rounded-xl border border-blue-100 p-4 mb-4
Fallback 라벨:   text-xs text-blue-400 mb-1   "추천"
Fallback 텍스트: text-sm font-semibold text-blue-700 truncate
```

---

# 20. 최종 생성 요구사항

1. **RightSidebar 구조** — PopularPosts → MostCommentedPosts → AdSlot(MIDDLE) → AdSlot(BOTTOM)
2. **AdSlot props** — `slot`만 받음, regionId/aptId는 내부에서 userStore 구독
3. **광고 라벨** — `"광고"` 텍스트 필수 (법적 의무, text-xs text-gray-400)
4. **useAd hook** — `useMemo([slot])`으로 랜덤 선택 1회 고정 후 `initialData`에 전달
5. **mock 모드** — `enabled: false` + `initialData: mockAd` → Skeleton 없이 즉시 렌더링 (의도된 동작)
6. **API 모드** — `enabled: true` + `initialData: undefined` → isLoading → Skeleton 표시
7. **Impression useEffect** — 단일 useEffect, `[ad?.adId, slot]` 의존성, 초기화 + observer 생성 통합
8. **Impression 1회 보장** — `hasTracked` ref + `observer.disconnect()`
9. **`window.open` 보안** — `'_blank', 'noopener,noreferrer'` 필수
10. **Fallback** — `AdFallback` 컴포넌트, `useNavigate()`, MIDDLE → `/trade`, BOTTOM → `/map`
11. **타입명** — `AdFallbackContent` (컴포넌트 `AdFallback`과 구분)
12. **트래킹 export** — `trackImpression`, `trackClick` 모두 `export` 명시
13. **aptId 빈 문자열** — `URLSearchParams`에서 빈 문자열 제외 (`if (aptId) params.append(...)`)
14. **`/post/:id` sticky top** — `top-[56px]` (TabBar 없음, 커뮤니티 사이드바 v3 기준 통일)
15. **Skeleton** — API 모드에서만 표시, mock 모드에서는 즉시 광고 렌더링
16. **mock 데이터** — `mockAdData.ts`, `USE_MOCK_AD` 플래그 포함, placehold.co URL
