# 실거래탭 P0 - 전세/월세 데이터 UX 정리 PRD
## v1.0 | 2026-06-17 | 구현 전용 개발 플랜

> 대상: HomeBlind 실거래탭 `/trade`, `/trade/apartment/:id`, 실거래 사이드바 필터  
> 우선순위: P0  
> 목적: 현재 수집 데이터가 매매 중심인 상태에서 전세/월세 선택 UX가 고장처럼 보이지 않도록 정리한다.  
> 연관 문서: `실거래탭_다음구현_PRD.md`, `실거래탭_UI기능확장.md`, `실거래탭 사이드바 UI_PRD.md`

---

## 1. 배경

현재 프론트 UI에는 `매매`, `전세`, `월세` 거래유형이 모두 노출된다.

그러나 백엔드 수집기는 국토교통부 아파트 매매 실거래 API만 사용한다.

```text
RealTradeCollector
- API: getRTMSDataSvcAptTrade
- 저장 tradeType: SALE
- 전세/월세 수집기: 없음
```

백엔드 조회 API와 DB 모델은 `LEASE`, `MONTHLY` 타입을 받을 수 있지만, 실제 운영 데이터는 매매만 존재할 가능성이 높다. 이 상태에서 사용자가 전세/월세를 선택하면 빈 목록, 빈 차트, 0건 상태만 보게 되어 기능 장애처럼 인식할 수 있다.

---

## 2. 목표

1. 전세/월세 데이터 미제공 상태를 사용자가 즉시 이해하게 한다.
2. 매매 실거래 조회와 기존 필터 기능은 유지한다.
3. 전월세 수집기 추가 전까지 제품 신뢰도를 해치지 않는 UX로 정리한다.
4. 추후 전월세 수집기 도입 시 비활성 정책을 쉽게 제거할 수 있게 한다.

---

## 3. 비목표

이번 P0에서는 아래 작업을 하지 않는다.

1. 전월세 공공데이터 수집기 신규 구현
2. `getRTMSDataSvcAptRent` 연동
3. 전월세 DB 스키마 확장
4. 월세 보증금/월세 금액 저장 정책 확정
5. 지도탭 전세/월세 필터 정책 변경

---

## 4. 제품 정책

### 4.1 P0 권장 정책

```text
매매: 활성
전세: 비활성 + 준비중 표시
월세: 비활성 + 준비중 표시
```

사용자는 전세/월세를 선택할 수 없어야 한다. 단, 이미 URL query나 저장 필터에 전세/월세 값이 들어온 경우에는 매매 기준으로 안전하게 보정하고 안내 문구를 노출한다.

### 4.2 안내 문구

기본 안내 문구:

```text
현재는 매매 실거래만 제공됩니다.
전세/월세 데이터는 준비 중입니다.
```

짧은 배지 문구:

```text
준비중
```

저장 필터 또는 URL로 전세/월세가 유입된 경우:

```text
전세/월세 필터는 아직 제공되지 않아 매매 기준으로 조회합니다.
```

---

## 5. 사용자 시나리오

### 5.1 아파트 상세 거래유형 탭

1. 사용자가 `/trade/apartment/:id`에 진입한다.
2. `TradeTypeFilter`에 `전체`, `매매`, `전세`, `월세`가 보인다.
3. `전세`, `월세`는 흐린 스타일과 `준비중` 배지로 표시된다.
4. 사용자가 전세/월세를 클릭해도 선택 상태가 바뀌지 않는다.
5. 매매 또는 전체 선택 시 기존처럼 차트와 거래내역이 조회된다.

### 5.2 실거래 사이드바 빠른 필터

1. 사용자가 `/trade` 또는 상세 페이지에서 사이드바 `빠른 필터`를 연다.
2. `거래유형` 그룹에 `매매`, `전세`, `월세`가 보인다.
3. `전세`, `월세`는 비활성 상태이며 `준비중`으로 표시된다.
4. 전세/월세는 클릭해도 store에 반영되지 않는다.
5. 기존에 store 또는 저장 필터에 전세/월세가 들어온 경우 `dealType`을 `SALE` 또는 `null`로 보정한다.

### 5.3 빈 결과 상태

1. 서버 응답이 0건인 경우에도 빈 화면만 노출하지 않는다.
2. 현재 선택 조건이 매매 기준이면 기존 빈 결과 문구를 사용한다.
3. 전세/월세 값이 유입된 상태라면 매매 기준 보정 안내를 함께 표시한다.

---

## 6. 상세 요구사항

### 6.1 `TradeTypeFilter`

변경 대상:

```text
frontend/src/components/features/trade/TradeTypeFilter.tsx
```

요구사항:

1. 타입 옵션 메타데이터에 `disabled`, `badge`, `disabledReason`을 추가한다.
2. `전세`, `월세` 옵션은 `disabled: true`로 지정한다.
3. 비활성 옵션은 `button disabled` 또는 클릭 가드로 선택 변경을 막는다.
4. 비활성 옵션은 `aria-disabled=true` 또는 `disabled` 속성을 제공한다.
5. `준비중` 배지는 버튼 텍스트 옆에 작게 표시한다.
6. 기존 선택값이 `전세`, `월세`인 상태로 렌더링되면 `전체` 또는 `매매`로 보정한다.

권장 UI:

```text
[전체] [매매] [전세 준비중] [월세 준비중]
```

스타일 기준:

```text
활성 선택: text-blue-500 border-blue-500 font-semibold
일반 선택 가능: text-gray-500 hover:text-gray-700
비활성: text-gray-300 cursor-not-allowed
준비중 배지: bg-gray-100 text-gray-400 rounded px-1.5 py-0.5 text-[10px]
```

### 6.2 `QuickFilters` 거래유형

변경 대상:

```text
frontend/src/components/features/trade-sidebar/QuickFilters.tsx
frontend/src/components/features/trade-sidebar/FilterChip.tsx
```

요구사항:

1. `DEAL_TYPE_OPTIONS`에 `disabled`, `badge` 메타데이터를 추가한다.
2. `JEONSE`, `MONTHLY`는 비활성 처리한다.
3. `FilterChip`이 disabled 상태를 받을 수 있게 확장한다.
4. disabled chip은 클릭해도 `setDealType`을 호출하지 않는다.
5. `전세`, `월세` chip에는 `준비중` 배지를 표시한다.
6. 저장 필터를 적용할 때 `dealType`이 `JEONSE` 또는 `MONTHLY`이면 `SALE` 또는 `null`로 보정한다.

권장 보정 정책:

```text
저장 필터 dealType = JEONSE  -> dealType = SALE
저장 필터 dealType = MONTHLY -> dealType = SALE
URL query dealType = JEONSE  -> dealType = SALE
URL query dealType = MONTHLY -> dealType = SALE
```

이유: 현재 실거래탭은 매매 데이터 중심이므로, 필터 보정 후에도 사용자는 유효한 결과를 볼 가능성이 높다.

### 6.3 상세 페이지 선택값 보정

변경 대상:

```text
frontend/src/pages/ApartmentTradePage.tsx
frontend/src/hooks/useApartmentTrade.ts
```

요구사항:

1. `dealType` store 값이 `JEONSE` 또는 `MONTHLY`일 때 상세 페이지 조회 query에 그대로 전달하지 않는다.
2. 상세 페이지의 `selectedType`이 `전세`, `월세`로 남지 않게 한다.
3. 차트 기준 타입은 `전체` 또는 `매매`일 때 매매 데이터로 렌더링한다.
4. 보정이 발생했을 때 상단 또는 필터 인접 영역에 안내 문구를 1회성으로 표시한다.

권장 구현:

```text
const isUnsupportedRentType = dealType === 'JEONSE' || dealType === 'MONTHLY'
const effectiveDealType = isUnsupportedRentType ? 'SALE' : dealType
```

### 6.4 API query 정책

변경 대상:

```text
frontend/src/pages/TradePage.tsx
frontend/src/hooks/useApartmentTrade.ts
frontend/src/stores/tradeFilterStore.ts
```

요구사항:

1. 프론트에서 `/api/v1/apartments/:id/trades`에 `dealType=JEONSE`, `dealType=MONTHLY`를 보내지 않는다.
2. 프론트에서 `/api/v1/apartments/:id/price-history`에 `dealType=JEONSE`, `dealType=MONTHLY`를 보내지 않는다.
3. `/trade` ranking/top apartment 조회도 동일하게 매매 기준으로 보정한다.
4. 보정 함수는 중복 구현하지 않고 공통 유틸 또는 store helper로 둔다.

권장 helper:

```ts
type DealType = 'SALE' | 'JEONSE' | 'MONTHLY' | null

export const normalizeSupportedDealType = (dealType: DealType): 'SALE' | null => {
  if (dealType === 'JEONSE' || dealType === 'MONTHLY') return 'SALE'
  return dealType
}
```

### 6.5 백엔드

변경 대상:

```text
backend/src/main/java/com/realestate/collect/RealTradeCollector.java
backend/src/main/java/com/realestate/service/TradeStatsService.java
backend/src/main/java/com/realestate/service/ApartmentService.java
```

P0 필수 변경:

1. 신규 수집기 구현 없음.
2. 현재 `RealTradeCollector` 주석 또는 문서에 "매매 전용 수집기" 상태를 명확히 유지한다.
3. 백엔드 API는 기존처럼 `LEASE`, `MONTHLY`를 받을 수 있어도 된다.
4. 단, 프론트 P0 정책상 전월세 query를 보내지 않는 것을 기준으로 한다.

선택 변경:

1. 서버 방어 로직으로 `dealType=JEONSE/MONTHLY` 요청 시 빈 배열 대신 `SALE`로 보정할지 여부는 P1에서 결정한다.
2. P0에서는 프론트 보정만 필수다.

---

## 7. 구현 순서

### Step 1. 거래유형 지원 정책 상수화

작업:

1. 지원 가능한 거래유형을 프론트 상수로 분리한다.
2. `SALE`만 활성으로 정의한다.
3. 전세/월세 보정 helper를 추가한다.

후보 위치:

```text
frontend/src/types/trade.ts
frontend/src/utils/tradeType.ts
```

완료 기준:

1. `JEONSE`, `MONTHLY` 지원 여부가 컴포넌트 내부에 하드코딩되어 흩어지지 않는다.
2. query 생성부에서 같은 helper를 재사용할 수 있다.

### Step 2. `TradeTypeFilter` 비활성 UI 구현

작업:

1. `전세`, `월세` 탭 disabled 처리
2. `준비중` 배지 추가
3. 선택 변경 가드 추가
4. 접근성 속성 추가

완료 기준:

1. 전세/월세 클릭 시 selectedType이 바뀌지 않는다.
2. 매매/전체 탭은 기존처럼 동작한다.
3. 모바일 폭에서도 배지가 버튼 밖으로 넘치지 않는다.

### Step 3. `QuickFilters` 비활성 UI 구현

작업:

1. `FilterChip`에 disabled prop 추가
2. `QuickFilters` 거래유형 옵션 중 전세/월세 비활성
3. 저장 필터 적용 시 unsupported dealType 보정
4. 초기화 버튼은 기존처럼 모든 필터 초기화

완료 기준:

1. 전세/월세 chip 클릭 시 `dealType`이 바뀌지 않는다.
2. 저장 필터에 전월세 값이 있어도 조회가 빈 상태로 고정되지 않는다.
3. `현재 조건 N건` 표시가 기존처럼 유지된다.

### Step 4. query 보정 적용

작업:

1. `TradePage` URL query 읽기/쓰기 보정
2. `useApartmentTrade` query 생성부 보정
3. 상세 페이지 `selectedType`/`chartTradeType` 보정

완료 기준:

1. 네트워크 요청에 `dealType=JEONSE`, `dealType=MONTHLY`가 포함되지 않는다.
2. 전월세 URL로 직접 접근해도 매매 데이터 기준으로 화면이 복구된다.
3. 차트와 거래내역이 서로 다른 타입 기준으로 어긋나지 않는다.

### Step 5. 안내 문구와 빈 상태 정리

작업:

1. 보정 발생 시 안내 배너 또는 inline notice 추가
2. 빈 결과 상태 문구 정리
3. 기존 로딩/에러 UI와 충돌 없는지 확인

완료 기준:

1. 사용자가 전세/월세 미제공 이유를 볼 수 있다.
2. 빈 리스트만 남는 화면이 없다.
3. 안내 문구는 과도하게 반복 노출되지 않는다.

---

## 8. 테스트 체크리스트

### 8.1 수동 QA

1. `/trade` 진입 후 사이드바 상세 필터를 연다.
2. 거래유형에서 전세/월세가 비활성 + 준비중으로 보이는지 확인한다.
3. 전세/월세 chip 클릭 시 선택 상태가 바뀌지 않는지 확인한다.
4. 매매 chip 클릭 시 기존 조회가 정상 동작하는지 확인한다.
5. `/trade/apartment/:id` 진입 후 `TradeTypeFilter`를 확인한다.
6. 전세/월세 탭 클릭 시 selected 상태가 바뀌지 않는지 확인한다.
7. 전체/매매 탭은 기존처럼 차트와 거래내역을 렌더링하는지 확인한다.
8. 모바일 390px에서 `준비중` 배지가 줄바꿈/겹침 없이 보이는지 확인한다.

### 8.2 URL/query QA

1. `/trade?dealType=JEONSE`로 직접 진입한다.
2. 화면이 매매 기준으로 보정되는지 확인한다.
3. 네트워크 요청에 `dealType=JEONSE`가 남지 않는지 확인한다.
4. `/trade?dealType=MONTHLY`도 동일하게 확인한다.
5. 상세 페이지에서 저장 필터 또는 store 값이 전월세인 상태를 재현한다.
6. `/trades`, `/price-history` 요청이 `SALE` 또는 dealType 미지정으로 나가는지 확인한다.

### 8.3 자동 테스트 후보

프론트:

```text
TradeTypeFilter
- disabled 타입 클릭 시 onChange 미호출
- 준비중 배지 렌더링

FilterChip
- disabled 클릭 시 onClick 미호출
- disabled 스타일 적용

normalizeSupportedDealType
- SALE -> SALE
- JEONSE -> SALE
- MONTHLY -> SALE
- null -> null
```

백엔드:

```text
P0 필수 신규 테스트 없음
```

---

## 9. 완료 기준

1. 전세/월세 선택이 불가능하거나 명확히 준비중으로 표시된다.
2. 전세/월세 URL/query/store 값이 유입되어도 매매 기준으로 복구된다.
3. 매매 실거래 조회, 가격흐름 차트, 최근 실거래 내역은 기존처럼 동작한다.
4. 네트워크 요청에 전월세 dealType이 전달되지 않는다.
5. 사용자가 빈 화면만 보고 기능 장애로 오해하지 않는다.
6. 프론트 빌드가 통과한다.

---

## 10. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 전세/월세를 완전히 숨기면 추후 제공 예정인지 알기 어렵다 | 기능 축소로 보일 수 있음 | 숨기지 않고 비활성 + 준비중으로 표시 |
| 저장 필터에 전월세 값이 남아 빈 결과를 만들 수 있음 | 재방문 사용자 혼란 | 저장 필터 적용 시 매매로 보정 |
| URL query로 전월세가 직접 유입될 수 있음 | 빈 차트/빈 목록 발생 | query 생성 전 normalize 적용 |
| 지도탭 필터와 정책이 달라질 수 있음 | 탭 간 UX 불일치 | 이번 P0 범위는 실거래탭으로 제한하고 지도탭은 별도 PRD에서 결정 |

---

## 11. 후속 과제

1. 전월세 공공데이터 수집기 PRD 작성
2. 월세 `deposit`, `monthlyRent` 저장 스키마 확정
3. 전월세 차트 표시 기준 확정
4. 지도탭 전세/월세 필터 정책 통합
5. 백엔드에서 unsupported dealType을 서버 차원에서 보정할지 결정

