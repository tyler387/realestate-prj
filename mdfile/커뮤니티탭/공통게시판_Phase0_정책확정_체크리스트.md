# 공통게시판 Phase 0 정책 확정 체크리스트
## v1.0 | GLOBAL/APARTMENT 커뮤니티 구현 전 확정안

> 기준일: 2026-05-22  
> 상위 문서: `mdfile/커뮤니티탭/공통게시판_블라인드형_커뮤니티확장_플랜.md`  
> 목적: DB migration/API 구현 전에 흔들리면 안 되는 정책값을 먼저 확정한다.

---

## 1. Phase 0 결론

Phase 0은 아래 방향으로 확정하고 Phase 1 구현에 들어간다.

1. 커뮤니티는 `전체 커뮤니티(GLOBAL)`와 `우리 아파트(APARTMENT)`로 분리한다.
2. 공통 게시판은 `aptId` 없이 조회/작성 가능해야 한다.
3. 아파트별 게시판은 기존처럼 `aptId` 기준으로 조회한다.
4. 공통 게시판에서도 인증 사용자의 아파트 인증 배지를 노출한다.
5. MVP에서는 글쓰기/댓글/좋아요를 `아파트 인증 회원`에게만 허용한다.
6. 기존 아파트별 커뮤니티 기능은 회귀 없이 유지한다.

---

## 2. 게시판 Scope 확정

## 2.1 Scope 코드

| Scope | 의미 | aptId | 용도 |
|---|---|---:|---|
| `GLOBAL` | 전체 커뮤니티 | null | 블라인드식 공통 게시판 |
| `APARTMENT` | 우리 아파트 | required | 기존 아파트별 커뮤니티 |

## 2.2 URL/상태 규칙

프론트 상태는 아래 값을 기본으로 가진다.

```ts
type CommunityScope = 'GLOBAL' | 'APARTMENT'
type GlobalBoardCode = 'BLAH' | 'REAL_ESTATE' | 'STOCK' | 'DATING'
type ApartmentBoardCode = 'APT_ALL' | 'APT_FREE' | 'APT_QNA' | 'APT_INFO' | 'APT_TRADE' | 'APT_ISSUE'
```

초기 진입 기본값:

1. 인증 아파트가 없거나 게스트: `GLOBAL / BLAH`
2. 인증 아파트가 있는 사용자: `GLOBAL / BLAH`
3. 사용자가 `우리 아파트` 탭을 누른 경우에만 `APARTMENT`로 전환

이유: 서비스 첫 화면을 공통 커뮤니티로 열어 게시글 밀도를 확보한다.

---

## 3. 공통 게시판 카테고리 확정

## 3.1 MVP 카테고리

MVP는 4개로 시작한다.

| boardCode | 표시명 | 설명 |
|---|---|---|
| `BLAH` | 블라블라 | 자유/잡담/일상 |
| `REAL_ESTATE` | 부동산 | 시장, 청약, 대출, 지역 이슈 |
| `STOCK` | 주식 | 국내/미국주식, 투자 잡담 |
| `DATING` | 연애 | 연애, 결혼, 인간관계 |

## 3.2 보류 카테고리

아래는 P1 이후 트래픽을 보고 추가한다.

1. `CAREER`: 이직/직장
2. `QNA`: 질문
3. `INTERIOR`: 인테리어
4. `PARENTING`: 육아/교육

보류 이유: 초기에 게시판을 너무 쪼개면 글 밀도가 낮아진다.

---

## 4. 우리 아파트 게시판 카테고리 확정

기존 카테고리 UI와 호환성을 유지하면서 내부 코드만 명확히 한다.

| boardCode | 표시명 | 설명 |
|---|---|---|
| `APT_ALL` | 전체 | 아파트별 게시판 전체 |
| `APT_FREE` | 자유 | 단지 주민 자유글 |
| `APT_QNA` | 질문 | 생활/관리/주변 질문 |
| `APT_INFO` | 정보 | 단지/동네 정보 |
| `APT_TRADE` | 실거래 | 실거래/가격 이야기 |
| `APT_ISSUE` | 민원/하자 | 관리, 하자, 소음, 주차 |

기존 `category` 문자열은 migration/호환 레이어에서 위 코드로 매핑한다.

---

## 5. 인증 배지 정책 확정

## 5.1 배지 문구

상세/댓글:

```text
아파트 인증: {아파트명}
```

카드/목록:

```text
인증 · {아파트명}
```

## 5.2 노출 위치

1. 게시글 카드 작성자 메타
2. 게시글 상세 작성자 영역
3. 댓글 작성자 메타
4. 마이페이지 내가 쓴 글/댓글 목록

## 5.3 스냅샷 정책

글/댓글 작성 시점의 인증 정보를 저장한다.

저장 필드:

1. `author_verified_apt_id`
2. `author_verified_apt_name`
3. `author_verification_label`

사용자가 이후 다른 아파트로 재인증해도 기존 글의 배지는 변경하지 않는다.

## 5.4 개인정보 제한

1. 동/호수는 저장하지 않는다.
2. 동/호수는 노출하지 않는다.
3. 아파트명만 노출한다.
4. 아파트명 마스킹은 MVP에서 하지 않는다.

---

## 6. 권한 정책 확정

## 6.1 MVP 권한 매트릭스

| 사용자 상태 | 읽기 | 글쓰기 | 댓글 | 좋아요 |
|---|---:|---:|---:|---:|
| 게스트 | 가능 | 불가 | 불가 | 불가 |
| 로그인 미인증 | 가능 | 불가 | 불가 | 불가 |
| 아파트 인증 회원 | 가능 | 가능 | 가능 | 가능 |

## 6.2 제한 시 UX

게스트:

1. 로그인 바텀시트 노출
2. CTA: `로그인하고 참여하기`

로그인 미인증:

1. 아파트 인증 유도 바텀시트 또는 배너 노출
2. CTA: `아파트 인증하고 참여하기`

## 6.3 서버 정책

프론트에서 버튼을 숨겨도 서버에서 반드시 검증한다.

1. 글쓰기: 인증 회원만
2. 댓글: 인증 회원만
3. 좋아요: 인증 회원만
4. 삭제: 작성자 본인만

---

## 7. 데이터 Migration 정책

## 7.1 기존 게시글

기존 글은 모두 아파트별 게시판 글로 취급한다.

```text
board_scope = 'APARTMENT'
apt_id = 기존 apt_id 유지
```

## 7.2 기존 category 매핑

| 기존 category | 신규 boardCode |
|---|---|
| 전체 | `APT_ALL` |
| 자유 | `APT_FREE` |
| 질문 | `APT_QNA` |
| 정보 | `APT_INFO` |
| 실거래 | `APT_TRADE` |
| 민원/하자 | `APT_ISSUE` |
| 기타/알 수 없음 | `APT_FREE` |

## 7.3 기존 작성자 인증 필드

기존 글은 가능한 범위에서 아래처럼 채운다.

1. `author_verified_apt_id = apt_id`
2. `author_verified_apt_name = complex_name`
3. `author_verification_label = '아파트 인증: ' + complex_name`

단, 이 값은 실제 인증 이력 기반이 아니라 기존 게시글 데이터 기반 backfill임을 주석으로 남긴다.

---

## 8. API 정책 확정

## 8.1 목록 조회

신규 권장 API:

```text
GET /api/community/posts?scope=GLOBAL&boardCode=BLAH&sortType=최신순
GET /api/community/posts?scope=APARTMENT&aptId=3100&boardCode=APT_FREE&sortType=최신순
```

기존 호환:

```text
GET /api/community/posts?aptId=3100&category=자유
```

기존 요청은 서버에서 아래처럼 해석한다.

```text
scope = APARTMENT
boardCode = category 매핑값
```

## 8.2 글 작성

신규 요청:

```json
{
  "scope": "GLOBAL",
  "boardCode": "BLAH",
  "title": "요즘 대출금리 체감 어때요?",
  "content": "..."
}
```

APARTMENT 글 작성 시:

```json
{
  "scope": "APARTMENT",
  "aptId": 3100,
  "boardCode": "APT_TRADE",
  "title": "최근 거래가 얘기",
  "content": "..."
}
```

서버가 토큰/세션에서 작성자 정보를 채운다. 장기적으로 프론트가 `authorNickname`, `complexName`을 보내는 구조는 제거한다.

---

## 9. Phase 1 작업 단위

## 9.1 DB

1. `posts.apt_id` nullable 허용
2. `posts.board_scope` 추가
3. `posts.board_code` 추가
4. `posts.author_user_id` 추가
5. `posts.author_verified_apt_id` 추가
6. `posts.author_verified_apt_name` 추가
7. `posts.author_verification_label` 추가
8. 기존 데이터 backfill
9. 조회 인덱스 추가

권장 인덱스:

```sql
CREATE INDEX idx_posts_scope_board_created
  ON posts(board_scope, board_code, created_at DESC);

CREATE INDEX idx_posts_apartment_board_created
  ON posts(apt_id, board_code, created_at DESC);
```

## 9.2 Backend

1. `CommunityPost` 엔티티 확장
2. `CommunityPostDto` 확장
3. `CreateCommunityPostRequest` 확장
4. `CommunityPostRepository` scope/boardCode 조회 추가
5. `CommunityService.getPosts` 신규 파라미터 처리
6. 기존 `aptId/category` 요청 호환 처리
7. 글쓰기 인증 검증 추가
8. DTO 변환 시 인증 배지 필드 반환

## 9.3 Frontend

1. `postStore`에 `scope`, `boardCode` 추가
2. `CategoryFilter`를 scope별 board 탭으로 확장
3. `CommunityPage`에 `전체 커뮤니티 / 우리 아파트` 탭 추가
4. `communityService.fetchPosts` 파라미터 확장
5. `PostCard`에 인증 배지 추가
6. `WritePage` 요청 payload 변경
7. 인증 미완료 사용자의 액션 제한 UX 추가

---

## 10. Phase 1 진입 조건

아래 항목은 확정으로 보고 Phase 1에 들어간다.

1. Scope: `GLOBAL`, `APARTMENT`
2. MVP 공통 게시판: `BLAH`, `REAL_ESTATE`, `STOCK`, `DATING`
3. MVP 권한: 아파트 인증 회원만 쓰기/댓글/좋아요 가능
4. 인증 배지: 목록 `인증 · {아파트명}`, 상세 `아파트 인증: {아파트명}`
5. 기존 글: 모두 `APARTMENT`로 migration

---

## 11. 보류 결정

Phase 0에서 결정하지 않고 P1/P2로 미룬다.

1. 아파트 등급/가격대 기반 계급 배지
2. 아파트명 마스킹 옵션
3. 공통 게시판별 작성 제한
4. 익명 단계 설정
5. 랭킹/명예 배지
6. 신고/제재 고도화

---

## 12. 다음 액션

Phase 1에서 먼저 할 일:

1. Flyway migration 작성
2. `CommunityPost` 엔티티 확장
3. 기존 아파트별 게시판 API 회귀 보장
4. `GLOBAL/BLAH` 목록 조회 API 추가
5. 프론트에 scope 탭만 먼저 붙여 API와 연결
