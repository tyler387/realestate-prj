# 실거래탭 다음 구현 PRD
## v1.0 | 2026-06-16 | 모바일 필터/상세 필터 보강 이후 후속 작업

> 대상: HomeBlind 실거래탭  
> 범위: `/trade`, `/trade/apartment/:id`, 실거래 필터/차트/전월세 데이터 처리  
> 목적: 이미 구현된 필터 구조를 실제 사용성 기준으로 마감하고, 데이터가 없는 거래유형으로 인한 UX 혼란을 줄인다.

---

## 1. 현재 완료 상태

아래 항목은 구현 완료된 것으로 본다.

1. `/trade` 모바일 필터 드로어
2. `QuickFilters`, `PriceTrendSummary` 모바일 접근
3. `/trade` 메인 랭킹 필터 API 파라미터 연동
4. `/trade/apartment/:id` 상세 거래내역 필터 API 파라미터 연동
5. `/trade/apartment/:id` 가격흐름 차트 필터 API 파라미터 연동
6. 기간/직접 지정 기간/가격대/거래유형/면적/층수/연차/단지명/이상치 제외 query 연동
7. 프론트 빌드 및 백엔드 테스트 통과

---

## 2. 다음 구현 우선순위

## P0 - 전세/월세 데이터 UX 정리

### 문제

현재 UI에는 `매매`, `전세`, `월세` 필터가 있지만, 백엔드 수집기는 매매 실거래 API만 사용한다.

현재 수집 기준:

```text
RealTradeCollector: getRTMSDataSvcAptTrade
저장 tradeType: SALE
```

따라서 `전세`, `월세` 선택 시 사용자는 기능이 고장난 것처럼 느낄 수 있다.

### 구현 방향

이번 단계에서는 전월세 수집기를 새로 만들기보다, 데이터 상태를 명확히 표시한다.

1. 전세/월세 데이터가 실제로 없으면 필터 선택 시 안내 문구 표시
2. `TradeTypeFilter`에서 전세/월세를 비활성화하거나 `준비중` 배지 표시
3. `QuickFilters`의 거래유형 필터에서도 전세/월세 비활성화 또는 안내 처리
4. 추후 전월세 데이터 수집기 추가 전까지 매매 중심 UX로 정리

### 권장 정책

P0에서는 아래 방식을 권장한다.

```text
매매: 활성
전세: 비활성 + "준비중"
월세: 비활성 + "준비중"
```

이유:

1. 현재 데이터 수집 범위와 UI가 일치한다.
2. 빈 결과를 버그로 오해하는 문제를 줄인다.
3. 전월세 수집기 도입 전까지 제품 신뢰도를 유지한다.

### 변경 후보 파일

```text
frontend/src/components/features/trade/TradeTypeFilter.tsx
frontend/src/components/features/trade-sidebar/QuickFilters.tsx
frontend/src/pages/ApartmentTradePage.tsx
frontend/src/pages/TradePage.tsx
backend/src/main/java/com/realestate/collect/RealTradeCollector.java
```

### 완료 기준

1. 전세/월세 선택이 불가능하거나 명확히 준비중으로 표시된다.
2. 매매 데이터 조회는 기존처럼 정상 동작한다.
3. 사용자가 전세/월세를 선택했을 때 빈 화면만 보지 않는다.

---

## P1 - 필터 적용 버튼 동작 정리

### 문제

현재 `QuickFilters`에는 `적용` 버튼이 있지만 필터는 클릭 즉시 적용된다.  
버튼이 시각적으로는 중요한 액션처럼 보이지만 실제 역할이 약하다.

### 구현 방향

모바일 드로어에서는 임시 필터 상태와 실제 적용 상태를 분리한다.

1. 드로어 열기 시 현재 필터를 draft 상태로 복사
2. 칩 클릭은 draft만 변경
3. `적용` 클릭 시 Zustand store에 반영
4. `초기화` 클릭 시 draft와 store 모두 초기화
5. 데스크톱은 기존 즉시 적용 유지 가능

### 권장 컴포넌트 구조

```text
QuickFilters
- mode?: 'instant' | 'draft'
- onApplied?: () => void

Desktop sidebar:
  <QuickFilters mode="instant" />

Mobile drawer:
  <QuickFilters mode="draft" onApplied={onClose} />
```

### 변경 후보 파일

```text
frontend/src/components/features/trade-sidebar/QuickFilters.tsx
frontend/src/components/features/trade-sidebar/MobileTradeFilterDrawer.tsx
frontend/src/stores/tradeFilterStore.ts
```

### 완료 기준

1. 모바일에서 필터 선택만으로는 목록이 즉시 바뀌지 않는다.
2. `적용` 클릭 후 목록/URL/query가 갱신된다.
3. `초기화` 클릭 시 모든 필터가 해제된다.
4. 데스크톱 즉시 적용 동작은 깨지지 않는다.

---

## P2 - 차트 이동평균선 추가

### 문제

현재 가격흐름 차트는 월평균/실거래가/평당가 모드를 제공한다.  
거래 건수가 적은 단지는 월별 평균이 크게 흔들릴 수 있다.

### 구현 방향

`PriceChart`에 이동평균선을 추가한다.

1. 3개월 이동평균선 우선 추가
2. 옵션으로 6개월 이동평균선 확장 가능
3. 거래 건수 3개월 미만이면 이동평균선 숨김
4. tooltip에는 원값과 이동평균값을 같이 표시

### 권장 UX

```text
[평균가] [실거래가] [평당가]
[ ] 3개월 이동평균
```

또는 차트 우측 상단 토글:

```text
이동평균 OFF / 3개월 / 6개월
```

### 변경 후보 파일

```text
frontend/src/components/features/trade/PriceChart.tsx
frontend/src/types/trade.ts
```

### 완료 기준

1. 평균가 모드에서 3개월 이동평균선이 표시된다.
2. 실거래가 점 모드에서는 이동평균선이 과하게 겹치지 않는다.
3. 데이터가 부족하면 토글은 보이되 "표본 부족" 안내를 표시한다.

---

## 3. 후순위 작업

아래는 지금 바로 구현하지 않는다.

1. 전월세 공공데이터 수집기 추가
2. 가격 분포 뷰(IQR/최소/중앙/최대)
3. 정책/금리/입주 이벤트 마커
4. 급매의심/특수거래 판정 고도화

이유:

1. 데이터 정책 확정이 필요하다.
2. 구현 대비 초기 사용자 체감이 P0/P1보다 낮다.
3. 잘못된 기준으로 제공하면 신뢰도 리스크가 있다.

---

## 4. 내일 작업 추천 순서

1. `TradeTypeFilter`에서 전세/월세 비활성화 또는 준비중 표시
2. `QuickFilters` 거래유형 필터도 동일 정책 적용
3. 빈 결과 화면 문구를 "현재는 매매 실거래만 제공됩니다"로 정리
4. 모바일 드로어의 `적용` 버튼을 실제 적용 방식으로 변경할지 결정
5. 결정 후 `QuickFilters`를 `instant/draft` 모드로 분리

---

## 5. 테스트 체크리스트

### 전세/월세 UX 정리 테스트

1. `/trade` 접속
2. 모바일 필터 드로어 열기
3. 거래유형에서 전세/월세 상태 확인
4. 전세/월세가 비활성 또는 준비중으로 보이는지 확인
5. 매매 필터 선택 시 랭킹이 정상 조회되는지 확인
6. `/trade/apartment/:id` 상세 진입
7. 상세 거래유형 탭에서도 같은 정책이 유지되는지 확인

### 필터 적용 버튼 테스트

1. 모바일 `/trade` 접속
2. 필터 드로어 열기
3. 가격대/면적/층수 선택
4. `적용` 전에는 목록이 바뀌지 않는지 확인
5. `적용` 클릭 후 목록과 URL query가 바뀌는지 확인
6. 상세 페이지 진입 후 `/trades`, `/price-history` 요청 query가 유지되는지 확인

### 회귀 테스트

```bash
cd frontend
npm run build

cd ../backend
.\gradlew.bat test
```

