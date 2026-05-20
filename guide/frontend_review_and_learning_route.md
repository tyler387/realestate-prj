# 프론트엔드 코드 리뷰 + 초보자 학습 루트 가이드

## 문서 목적
이 문서는 현재 프로젝트 프론트엔드 구조를 **React 초보자 관점**에서 이해하기 쉽게 정리한 가이드입니다.

---

## 1. 프로젝트 큰 흐름

이 프론트엔드는 아래 조합으로 동작합니다.

- Vite
- React + TypeScript
- React Router
- React Query
- Zustand

핵심 실행 흐름:

1. `frontend/src/main.tsx`
- 앱 시작점
- `QueryClientProvider`로 감싸서 서버 캐시 기능 활성화

2. `frontend/src/App.tsx`
- `RouterProvider`로 라우터 연결

3. `frontend/src/router/index.tsx`
- URL별 페이지 매핑 (`/`, `/trade`, `/map`, `/post/:id` 등)

4. `frontend/src/components/layout/AppLayout.tsx`
- 헤더/탭바/사이드바/본문 공통 구조

5. `frontend/src/pages/*.tsx`
- 실제 화면 단위

6. 상태 관리
- 서버 상태: React Query (`useQuery`)
- 클라이언트 전역 상태: Zustand (`src/stores/*.ts`)

---

## 2. 초보자가 먼저 이해할 핵심 문법

- `useState`: 화면 상태(모달 열림, 배너 노출 등)
- `useEffect`: 값 변경 시 부수작업
- `props`: 부모 -> 자식 데이터 전달
- `Outlet`: 라우터 자식 화면 렌더링 위치
- `useQuery`: API 호출 + 로딩/에러/캐시 자동 관리
- Zustand store: 페이지 간 공유 상태 저장

---

## 3. 커뮤니티 페이지 예시로 보는 동작

파일: `frontend/src/pages/CommunityPage.tsx`

1. `userStore`에서 `apartmentId`, `status` 읽음
2. `postStore`에서 카테고리/정렬 읽음
3. `useQuery`로 `fetchPosts(...)` 호출
4. 로딩/에러/빈 상태를 조건 분기 렌더
5. `searchKeyword`가 있으면 목록 필터링
6. 아파트 미선택/게스트 여부에 따라 배너 분기

요약:

- 페이지는 `store 상태` + `query 데이터`를 읽고
- 조건 분기로 UI를 렌더링한다.

---

## 4. 현재 코드의 장점

1. 폴더 구조가 기능 단위로 분리됨 (`features`, `pages`, `stores`, `services`)
2. `MemberRoute`, `VerifiedRoute`로 권한 흐름이 명확함
3. 서버 상태(React Query)와 로컬 상태(Zustand) 역할 분리가 좋음

---

## 5. 개선 우선순위 (리뷰 요약)

### P0

1. 한글 인코딩 깨짐 정리
- 예: `?꾩껜`, `理쒖떊??`
- UI 문제 + API 파라미터 불일치 가능성

2. API 호출 공통화
- 파일마다 fetch 에러 처리 방식이 다름
- 공통 HTTP 유틸로 통일 권장

3. 타입 엄격화
- `Category`, `SortType`이 `string`
- 유니온 타입으로 제한 권장

### P1

4. 라우트 redirect 개선
- 보호 라우트 이동 시 `redirectTo`를 현재 경로 기반으로

5. 사이드바 훅 에러 처리 강화
- `r.ok` 검사 및 메시지 처리 명확화

---

## 6. React 초보자 학습 루트 (1~2시간)

## 0단계 (10분): 앱 부팅 구조 파악

읽을 파일:

1. `frontend/src/main.tsx`
2. `frontend/src/App.tsx`

목표:
- 앱이 어디서 시작되고 Provider가 어떻게 감싸는지 이해

## 1단계 (20분): 라우팅 + 레이아웃

읽을 파일:

1. `frontend/src/router/index.tsx`
2. `frontend/src/components/layout/AppLayout.tsx`
3. `frontend/src/components/layout/Header.tsx`
4. `frontend/src/components/layout/TabBar.tsx`

목표:
- URL -> 페이지 매핑 이해
- 공통 레이아웃에서 `Outlet` 개념 이해

## 2단계 (25분): 상태 저장소 이해

읽을 파일:

1. `frontend/src/stores/userStore.ts`
2. `frontend/src/stores/uiStore.ts`
3. `frontend/src/stores/postStore.ts`

목표:
- 어떤 상태를 어디 store에 두는지 감 잡기

## 3단계 (30분): 커뮤니티 데이터 흐름

읽을 파일:

1. `frontend/src/pages/CommunityPage.tsx`
2. `frontend/src/services/communityService.ts`
3. `frontend/src/components/features/community/PostList.tsx`
4. `frontend/src/components/features/community/PostCard.tsx`

목표:
- `query -> 상태 분기 -> 목록 렌더` 전체 흐름 체득

## 4단계 (20분): 인증/권한 흐름

읽을 파일:

1. `frontend/src/router/MemberRoute.tsx`
2. `frontend/src/router/VerifiedRoute.tsx`
3. `frontend/src/pages/LoginPage.tsx`
4. `frontend/src/stores/userStore.ts`

목표:
- 인증 상태에 따라 접근 제한되는 방식 이해

## 5단계 (15분): 실거래 화면 예시

읽을 파일:

1. `frontend/src/pages/TradePage.tsx`
2. `frontend/src/components/features/trade/PeriodFilter.tsx`
3. `frontend/src/components/features/trade/TradeRankingList.tsx`
4. `frontend/src/components/features/trade/TradeRankingCard.tsx`

목표:
- 다른 도메인(실거래)에서도 같은 패턴이 반복됨을 확인

---

## 7. 초보자 실습 과제 (추천)

1. 커뮤니티 정렬 옵션 하나 추가해보기
2. 사이드바 카드 제목 문구 변경해보기
3. `useQuery` 에러 시 메시지 문구 커스터마이즈
4. `Category`, `SortType`을 유니온 타입으로 바꿔보기

---

## 8. 마지막 체크포인트

아래 질문에 답할 수 있으면 구조를 잘 이해한 상태입니다.

1. API 데이터는 어디서 불러오고 어디서 캐시되는가?
2. 전역 상태는 어느 store에 두는가?
3. 보호 라우트는 어디서 막는가?
4. 페이지에서 로딩/에러/빈 상태를 어떻게 분기하는가?

---

작성일: 2026-05-18
