# 커뮤니티탭 사이드 정보영역 UI 확장 PRD
## v1.0 | 지역정보/인기 키워드/인기글/댓글많은글 개선

> 기준일: 2026-05-18  
> 대상: HomeBlind Frontend(Community 탭 + LeftSidebar) / Backend(선택적 지표 확장)  
> 목적: 커뮤니티탭 사이드 정보영역의 정보 밀도와 가독성을 높여 체류시간/탐색 전환율을 개선한다.

---

## 1. 배경 및 문제 정의

현재 커뮤니티탭 사이드 정보영역은 다음 한계가 있다.

1. `지역 정보` 카드가 작고 지표 수가 적어 가치 인지가 약함
2. `인기 키워드`가 단순 칩 나열 형태라 맥락(기간/강도) 전달이 약함
3. `인기글`, `댓글많은글` 리스트가 텍스트 중심으로 스캔성이 낮음
4. 카드 간 시각적 위계가 유사해 “무엇을 먼저 봐야 하는지”가 불명확함

---

## 2. 목표

### 2.1 기능 목표

1. 지역정보 카드의 핵심 지표를 3개 -> 6개 수준으로 확장
2. 인기/댓글 리스트의 순위 인지 속도 개선 (첫 3개 강조)
3. 키워드 카드에 기간/집계 기준 노출 및 상위 키워드 강조
4. 모바일/태블릿/데스크톱에서 카드 높이와 간격을 일관되게 확장

### 2.2 지표 목표 (출시 후 2주 관찰)

1. 사이드영역 내 클릭률(게시글 상세 진입) +15%
2. 커뮤니티 페이지 평균 체류시간 +10%
3. 아파트 선택 전환율 +8% (미선택 사용자 대상)

---

## 3. 범위

### 포함

1. `ApartmentInfoCard`, `TrendingKeywords`, `PopularPosts`, `MostCommentedPosts` UI 개편
2. 카드 공통 레이아웃 토큰(패딩/타이포/간격/배지 스타일) 정리
3. 로딩/빈상태/에러상태 UI 보강
4. 필요한 경우 최소한의 API 응답 필드 확장

### 제외

1. 실시간 스트리밍 집계 도입
2. 추천 알고리즘 변경
3. 다크모드 신규 도입

---

## 4. 상세 요구사항

## 4.1 지역 정보 카드 확장 (P0)

### UI 요구사항

1. 카드 최소 높이 확대: `min-height 220px` (기존 대비 약 +35% 목표)
2. 상단에 `아파트명 + 위치 + 상태 배지` 배치
3. 본문을 2열 KPI 그리드로 변경
4. 하단 CTA 2개 제공
   - `실거래 상세 보기`
   - `이 아파트 글쓰기`

### KPI 항목

1. 세대수
2. 준공연도
3. 최근 실거래가
4. 최근 전용면적(평)
5. 추정 평당가(최근가 기반 계산)
6. 데이터 기준일(최근 거래일, 없으면 "집계 준비중")

### 배지 규칙

1. `신축`: 준공 10년 이하
2. `대단지`: 1000세대 이상
3. `실거래활발`: 최근 30일 거래 3건 이상 (필드 없으면 추후 P1)

---

## 4.2 인기 키워드 카드 개선 (P0)

### UI 요구사항

1. 카드 타이틀 우측에 집계 기간 노출: `최근 7일`
2. 상위 3개 키워드는 강조 스타일(크기/배경/아이콘) 적용
3. 4~10위는 일반 칩으로 노출
4. 키워드 길이 초과 시 말줄임 + 전체보기 툴팁

### 상호작용

1. 키워드 클릭 시 해당 키워드로 커뮤니티 검색 필터 적용
2. 적용 중인 키워드는 Active 상태 칩으로 표시
3. 빈 데이터 시 대체 문구: `아직 집계된 키워드가 없습니다`

---

## 4.3 인기글/댓글많은글 리스트 개선 (P0)

### 공통

1. 카드 높이 확대 및 행 간격 증가 (`row gap` +4px)
2. 항목 좌측에 순위 배지 `1,2,3` 강조
3. 제목 2줄 클램프 + 메타정보 1줄
4. 스켈레톤을 실제 행 구조와 유사하게 개선

### 인기글 카드

1. 메타: `좋아요`, `댓글`, `작성시각`
2. 상위 3개 항목은 좌측 컬러 보더로 추가 강조
3. 마지막 행에 `더보기` 링크(커뮤니티 목록 정렬 전환)

### 댓글많은글 카드

1. 메타: `댓글수`, `최종 댓글 경과시간`
2. 댓글 급증 배지(최근 24h 댓글수 기준) P1 후보

---

## 4.4 반응형 레이아웃 규칙 (P0)

1. Desktop(`lg+`): 카드 폭 유지, 내부 패딩 확대 (`p-5`)
2. Tablet(`md~lg`): KPI 2열 유지, 텍스트 크기 소폭 축소
3. Mobile(`~md`):
   - 사이드카드가 본문 하단으로 이동 시 카드 간 간격 12px
   - KPI는 2열 유지하되 숫자 단위 축약(예: 1,250세대)

---

## 5. 기술 설계

## 5.1 프론트 컴포넌트 변경

1. `frontend/src/components/features/sidebar/ApartmentInfoCard.tsx`
2. `frontend/src/components/features/sidebar/TrendingKeywords.tsx`
3. `frontend/src/components/features/sidebar/PopularPosts.tsx`
4. `frontend/src/components/features/sidebar/MostCommentedPosts.tsx`
5. `frontend/src/components/features/sidebar/SidebarCard.tsx`
6. `frontend/src/components/features/sidebar/SidebarSkeleton.tsx`

## 5.2 타입/훅 변경

1. `frontend/src/types/sidebar.ts`
2. `frontend/src/hooks/useSidebarData.ts`

## 5.3 (선택) 백엔드 필드 확장

`ApartmentSummary` 응답에 아래 필드 검토

1. `recentTradeDate`
2. `recent30dTradeCount`

확장 파일 후보

1. `backend/src/main/java/com/realestate/web/dto/ApartmentSummaryDto.java`
2. `backend/src/main/java/com/realestate/domain/repository/ApartmentSummaryProjection.java`
3. `backend/src/main/java/com/realestate/domain/repository/ApartmentRepository.java`
4. `backend/src/main/java/com/realestate/service/ApartmentService.java`

---

## 6. 와이어프레임(텍스트)

### 6.1 지역 정보

[아파트명] [신축][대단지]
위치 텍스트

세대수 | 준공
최근가 | 전용면적
평당가 | 기준일

[실거래 상세 보기] [이 아파트 글쓰기]

### 6.2 인기 키워드

인기 키워드                최근 7일
[1위 키워드] [2위 키워드] [3위 키워드]
[4위] [5위] [6위] ...

### 6.3 인기글 / 댓글많은글

#1 제목 2줄
메타(좋아요/댓글/시간)
#2 ...
#3 ...
더보기

---

## 7. 구현 단계

### Phase 1 (P0, 1차)

1. 카드 사이즈/타이포/간격 확장
2. 지역정보 KPI 2열 구성
3. 인기/댓글 리스트 순위 배지 및 메타 강화
4. 키워드 Top3 강조 + 기간 노출

### Phase 2 (P1, 2차)

1. 백엔드 필드 확장(최근 거래일/30일 거래수)
2. 배지 고도화(`실거래활발`)
3. 더보기/정렬 연동 UX 개선

---

## 8. 테스트 및 완료 기준

## 8.1 체크리스트

1. `aptId` 없음/있음 상태 모두 레이아웃 정상
2. 로딩/에러/빈상태 UI 깨짐 없음
3. 모바일(`390px`)에서 텍스트 겹침 없음
4. 카드 클릭 동작(상세 이동/필터 적용) 정상

## 8.2 DoD

1. P0 항목 100% 반영
2. 커뮤니티 페이지 수동 QA 완료(Desktop/Tablet/Mobile)
3. Lighthouse 접근성 경고 주요 항목 해결(명도/버튼 라벨)
4. PR 머지 전 스크린샷 3종(Desktop/Tablet/Mobile) 첨부

---

## 9. 리스크 및 대응

1. 카드 확장으로 첫 화면 정보 과밀 가능
- 대응: 섹션별 위계(타이틀/여백/강조색) 통일

2. 데이터 부족 시 빈칸 다수 발생
- 대응: `집계 준비중`/`데이터 없음` 문구 표준화

3. API 확장 지연 시 배지 정확도 저하
- 대응: 1차는 프론트 계산 가능한 지표만 우선 반영
