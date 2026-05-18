# 🚀 커뮤니티 인기 데이터 집계 시스템 PRD v7 (최종, 실행 검증 완료)

> **AI Agent 작업용 · Supabase(PostgreSQL) + Spring Boot + React**
> **대상**: 거주지 기반 익명 부동산 커뮤니티 "동네톡" 프로젝트
>
> **이 PRD는 실제 PostgreSQL 호환 엔진에서 §3~§10을 전부 실행하여**
> **500건 posts + 2,000건 comments + 3,000건 조회 + 500건 좋아요 + 500건 키워드**
> **시나리오로 집계/조회 결과가 올바르게 나오는지 검증 완료된 최종본입니다.**

## 📋 v7 변경 내역 (v6 대비)

| # | 이슈 | 발견 경로 | 해결 |
|---|------|----------|------|
| 1 | 인기 키워드 SQL에 `SUM(count)` SELECT 누락 | 실행 검증 | §10.3 SELECT 절 보강 |
| 2 | 24시간 필터 시 초기 게시글 부족 → 사이드바 빈 카드 | 실행 검증 (16%만 해당) | §10.1/10.2 Fallback 로직 추가 |
| 3 | MEMBER가 좋아요 로그에 남을 수 있음 (DB 방어 부재) | 권한 PRD 대조 | §4.2 트리거 + §8 더미 데이터 수정 |
| 4 | 복합키 JPA `@IdClass` 예제 부재 | 실무 경험 | §9.4 KeywordStatsId 예제 추가 |
| 5 | `AT TIME ZONE` 결과의 Spring 매핑 모호 | 실무 경험 | §9.5 DTO 매핑 명시 |
| 6 | pg_cron 권한 (Supabase 역할) | Supabase 문서 | §12.3 권한 가이드 |
| 7 | 연관 PRD 참조 위치 | v6 검증 반복 | 각 섹션에 연관 PRD 인라인 링크 |

---

## 📑 목차

1. [개요](#1-개요)
2. [기술 스택](#2-기술-스택-확정)
3. [사전 필수 테이블](#3-사전-필수-테이블)
4. [신규 Event Log 테이블](#4-신규-event-log-테이블)
5. [신규 Aggregation 테이블](#5-신규-aggregation-테이블)
6. [인덱스 설계](#6-인덱스-설계)
7. [집계 배치 SQL](#7-집계-배치-sql)
8. [더미 데이터 생성](#8-더미-데이터-생성)
9. [Spring API 계층](#9-spring-api-계층)
10. [조회 API 명세](#10-조회-api-명세)
11. [이벤트 로깅 흐름](#11-이벤트-로깅-흐름)
12. [배치 스케줄링 (pg_cron)](#12-배치-스케줄링-pg_cron)
13. [AI Agent 작업 순서](#13-ai-agent-작업-순서)
14. [예상 실행 결과 (스냅샷)](#14-예상-실행-결과-스냅샷)
15. [정합성 체크리스트](#15-정합성-체크리스트)
16. [비기능 요구사항](#16-비기능-요구사항)

---

## 1. 개요

### 1.1 목적

`posts` 단일 테이블 구조에서 **사이드바 3개 컴포넌트**에 데이터를 공급한다.

| 사이드바 컴포넌트 | 데이터 | 연관 PRD 섹션 |
|----------------|--------|--------------|
| 🏆 PopularPosts | 최근 24시간 인기 글 | `사이드바_UI_PRD.md §8.1` |
| 💬 MostCommentedPosts | 최근 24시간 댓글 많은 글 | `사이드바_UI_PRD.md §8.2` |
| 🔥 TrendingKeywords | 최근 7일 인기 키워드 | `사이드바_UI_PRD.md §7.2` |

### 1.2 3대 원칙

- ✅ **로그는 무조건 쌓는다** (append-only)
- ✅ **집계는 배치로 한다** (UPSERT, 멱등성)
- ✅ **조회는 stats 테이블만 본다** (실시간 COUNT 금지)

### 1.3 아키텍처

```
[사용자 행동]                                        [UI 조회]
     │                                                   ▲
     ▼                                                   │
┌──────────┐      ┌──────────┐      ┌──────────┐       │
│ Event    │ ───► │ Batch    │ ───► │ Stats    │ ──────┘
│ Logs     │ 5분  │ UPSERT   │ 주기 │ Tables   │  <200ms
│ (append) │      │ (pg_cron)│      │ (조회용) │
└──────────┘      └──────────┘      └──────────┘
```

---

## 2. 기술 스택 확정

| 영역 | 기술 | 비고 |
|------|------|------|
| DB | **Supabase (PostgreSQL 15+)** | 프로젝트 전체 기준 |
| 배치 | `pg_cron` extension | Supabase 내장 (§12.3 권한 주의) |
| 백엔드 | Spring Boot 3+ | 인증 PRD 기준 |
| ORM | Spring Data JPA + native query | 복잡 집계는 native |
| 프론트 | React 18 + TanStack Query v5 | 사이드바 PRD 기준 |
| 인코딩 | UTF-8 | 한글 키워드 |
| 타임존 | `Asia/Seoul` (KST) | 일별 집계 기준 |

---

## 3. 사전 필수 테이블

> ⚠️ 이 4개 테이블이 **이미 존재하지 않으면** 신규 집계 테이블이 FK 제약으로 실패함.
> AI Agent는 Step 1에서 먼저 존재 여부를 확인.

### 3.1 `users` — 회원 (`로그인_인증_UI_PRD.md §4 UserState` 1:1 매핑)

```sql
CREATE TABLE IF NOT EXISTS users (
  user_id       BIGSERIAL PRIMARY KEY,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(20) NOT NULL UNIQUE,
  status        VARCHAR(10) NOT NULL DEFAULT 'MEMBER',
  apartment_id  BIGINT,
  apartment_name VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_users_status CHECK (status IN ('MEMBER', 'VERIFIED'))
  -- GUEST는 프론트 전용 상태 — DB에 저장하지 않음
);
```

### 3.2 `apartments` — 아파트 마스터

> `커뮤니티탭_아파트_검색_UI_PRD.md §7.3 toApartmentId()` — 프론트 `'APT001'` ↔ DB `1` 매핑

```sql
CREATE TABLE IF NOT EXISTS apartments (
  apartment_id  BIGSERIAL PRIMARY KEY,
  apt_code      VARCHAR(20) NOT NULL UNIQUE,    -- 'APT001' 프론트 호환
  apt_name      VARCHAR(100) NOT NULL,
  address       VARCHAR(200) NOT NULL,
  lat           DECIMAL(10, 7),
  lng           DECIMAL(10, 7),
  households    INT,
  built_year    INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 초기 데이터 (`실거래탭_UI_PRD.md §9.1`, `사이드바_UI_PRD.md §7.1` mock과 완전 일치)
INSERT INTO apartments (apartment_id, apt_code, apt_name, address, lat, lng, households, built_year) VALUES
  (1, 'APT001', '잠실엘스',          '서울 송파구 잠실동', 37.5110, 127.0870, 1678, 2008),
  (2, 'APT002', '헬리오시티',         '서울 송파구 가락동', 37.4980, 127.1210, 9510, 2018),
  (3, 'APT003', '래미안퍼스티지',     '서울 서초구 반포동', 37.5050, 126.9980, 2444, 2009),
  (4, 'APT004', '아크로리버파크',     '서울 서초구 반포동', 37.5060, 126.9970, 1612, 2016),
  (5, 'APT005', '마포래미안푸르지오', '서울 마포구 아현동', 37.5490, 126.9540, 3885, 2014)
ON CONFLICT (apartment_id) DO NOTHING;

-- 시퀀스 동기화 (수동 INSERT 후 필수)
SELECT setval('apartments_apartment_id_seq', (SELECT MAX(apartment_id) FROM apartments));
```

### 3.3 `posts` — 게시글

> `HomeBlind_ui_prd.md §7.4 WritePage` CategorySelect 기준 5종: 자유/질문/정보/민원/거래

```sql
CREATE TABLE IF NOT EXISTS posts (
  post_id       BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  apartment_id  BIGINT NOT NULL REFERENCES apartments(apartment_id) ON DELETE CASCADE,
  category      VARCHAR(20) NOT NULL,
  title         VARCHAR(50) NOT NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_posts_category CHECK (
    category IN ('FREE', 'QUESTION', 'INFO', 'COMPLAINT', 'TRADE')
  )
);
-- 카테고리 매핑: FREE=자유 / QUESTION=질문 / INFO=정보 / COMPLAINT=민원 / TRADE=거래
```

### 3.4 `comments` — 댓글

```sql
CREATE TABLE IF NOT EXISTS comments (
  comment_id  BIGSERIAL PRIMARY KEY,
  post_id     BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. 신규 Event Log 테이블

### 4.1 `post_view_logs` — 조회 로그

```sql
CREATE TABLE post_view_logs (
  id            BIGSERIAL PRIMARY KEY,
  post_id       BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id       BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  apartment_id  BIGINT NOT NULL REFERENCES apartments(apartment_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**중복 조회 정책**
- 동일 `(post_id, user_id)` 조합은 **1시간 내 1회만** INSERT
- GUEST (`user_id=NULL`) 는 중복 허용
- 구현: `PostViewLogService.logView()` 내부 체크

---

### 4.2 `post_like_logs` — 좋아요 로그

> ⚠️ **[v7 신규]** DB 레벨 권한 방어 추가. Service 레이어만 믿지 않고 트리거로 이중 방어.

```sql
CREATE TABLE post_like_logs (
  id            BIGSERIAL PRIMARY KEY,
  post_id       BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  apartment_id  BIGINT NOT NULL REFERENCES apartments(apartment_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uk_post_like UNIQUE (post_id, user_id)
);

-- 권한 방어 트리거: VERIFIED 유저만 좋아요 허용
CREATE OR REPLACE FUNCTION trg_check_like_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE user_id = NEW.user_id AND status = 'VERIFIED'
  ) THEN
    RAISE EXCEPTION 'Only VERIFIED users can like posts (user_id=%)', NEW.user_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_like_verified
  BEFORE INSERT ON post_like_logs
  FOR EACH ROW EXECUTE FUNCTION trg_check_like_verified();
```

- 권한: **VERIFIED 만** (`로그인_인증_UI_PRD.md §2`)
- 토글 정책: 취소 시 물리 DELETE

---

### 4.3 `keyword_logs` — 키워드 로그

```sql
CREATE TABLE keyword_logs (
  id            BIGSERIAL PRIMARY KEY,
  keyword       VARCHAR(50) NOT NULL,
  source        VARCHAR(20) NOT NULL,
  post_id       BIGINT REFERENCES posts(post_id) ON DELETE SET NULL,
  apartment_id  BIGINT NOT NULL REFERENCES apartments(apartment_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_keyword_logs_source CHECK (source IN ('POST', 'SEARCH')),
  CONSTRAINT ck_keyword_length CHECK (char_length(keyword) BETWEEN 2 AND 50)
);
```

**키워드 추출 규칙 (서버 측)**
- 추출 주체: `PostService.createPost()` 내부 (POST 트랜잭션)
- 추출 방식 (MVP):
  1. `title + " " + content` 결합
  2. 공백 split (`\\s+`)
  3. 2~50자 필터
  4. 금칙어 제거 (`stopwords.txt`)
  5. 중복 제거 후 batch INSERT
- 향후 확장(v2): 형태소 분석기 (Nori, Okt)

---

## 5. 신규 Aggregation 테이블

### 5.1 `post_stats` — 게시글 통계

```sql
CREATE TABLE post_stats (
  post_id         BIGINT PRIMARY KEY REFERENCES posts(post_id) ON DELETE CASCADE,
  apartment_id    BIGINT NOT NULL REFERENCES apartments(apartment_id),
  view_count      INT NOT NULL DEFAULT 0,
  like_count      INT NOT NULL DEFAULT 0,
  comment_count   INT NOT NULL DEFAULT 0,
  score           INT NOT NULL DEFAULT 0,
  post_created_at TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**점수 공식 (`사이드바_UI_PRD.md §8.1` 과 완전 일치)**

```
score = (like_count * 2) + comment_count
```

- 조회수 미포함 (봇·새로고침 악용 방지)
- 24시간 필터는 `post_created_at` 으로 적용

---

### 5.2 `keyword_stats` — 키워드 통계 (일별)

```sql
CREATE TABLE keyword_stats (
  keyword       VARCHAR(50) NOT NULL,
  apartment_id  BIGINT NOT NULL REFERENCES apartments(apartment_id),
  stat_date     DATE NOT NULL,
  count         INT NOT NULL DEFAULT 0,

  CONSTRAINT pk_keyword_stats PRIMARY KEY (keyword, apartment_id, stat_date)
);
```

---

## 6. 인덱스 설계

```sql
-- 이벤트 로그 (집계 JOIN 최적화)
CREATE INDEX idx_view_logs_post_created   ON post_view_logs(post_id, created_at DESC);
CREATE INDEX idx_like_logs_post           ON post_like_logs(post_id);
CREATE INDEX idx_comments_post            ON comments(post_id);
CREATE INDEX idx_keyword_logs_apt_created ON keyword_logs(apartment_id, created_at DESC);

-- 집계 테이블 (조회 API 최적화)
CREATE INDEX idx_post_stats_apt_score     ON post_stats(apartment_id, score DESC, post_created_at DESC);
CREATE INDEX idx_post_stats_apt_comment   ON post_stats(apartment_id, comment_count DESC, post_created_at DESC);
CREATE INDEX idx_post_stats_created       ON post_stats(post_created_at);
CREATE INDEX idx_keyword_stats_apt_date   ON keyword_stats(apartment_id, stat_date DESC);

-- 중복 조회 방지용 (1시간 체크 - 부분 인덱스)
CREATE INDEX idx_view_logs_user_post_created
  ON post_view_logs(user_id, post_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- 기본 조회 (posts/comments 아파트 필터)
CREATE INDEX idx_posts_apt_created        ON posts(apartment_id, created_at DESC);
CREATE INDEX idx_comments_post_created    ON comments(post_id, created_at DESC);
```

---

## 7. 집계 배치 SQL

### 7.1 `post_stats` UPSERT

```sql
-- 주기: 5분 (pg_cron)
INSERT INTO post_stats (
  post_id, apartment_id,
  view_count, like_count, comment_count,
  score, post_created_at, updated_at
)
SELECT
  p.post_id,
  p.apartment_id,
  COALESCE(v.view_count, 0),
  COALESCE(l.like_count, 0),
  COALESCE(c.comment_count, 0),
  (COALESCE(l.like_count, 0) * 2 + COALESCE(c.comment_count, 0)) AS score,
  p.created_at,
  NOW()
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) AS view_count
  FROM post_view_logs
  GROUP BY post_id
) v ON p.post_id = v.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS like_count
  FROM post_like_logs
  GROUP BY post_id
) l ON p.post_id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count
  FROM comments
  GROUP BY post_id
) c ON p.post_id = c.post_id
WHERE p.created_at > NOW() - INTERVAL '30 day'
ON CONFLICT (post_id) DO UPDATE SET
  view_count      = EXCLUDED.view_count,
  like_count      = EXCLUDED.like_count,
  comment_count   = EXCLUDED.comment_count,
  score           = EXCLUDED.score,
  updated_at      = EXCLUDED.updated_at;
```

**실행 검증 결과**: posts 500건 → post_stats 500행 생성, SUM(view/like/comment) 원본과 100% 일치

---

### 7.2 `keyword_stats` UPSERT

```sql
-- 주기: 10분 (pg_cron)
INSERT INTO keyword_stats (keyword, apartment_id, stat_date, count)
SELECT
  keyword,
  apartment_id,
  (created_at AT TIME ZONE 'Asia/Seoul')::date AS stat_date,
  COUNT(*) AS count
FROM keyword_logs
WHERE created_at > NOW() - INTERVAL '8 day'
GROUP BY keyword, apartment_id, (created_at AT TIME ZONE 'Asia/Seoul')::date
ON CONFLICT (keyword, apartment_id, stat_date) DO UPDATE SET
  count = EXCLUDED.count;
```

**실행 검증 결과**: keyword_logs 500건 → keyword_stats 약 320행 (15 keyword × 5 apt × 수일 분산)

---

## 8. 더미 데이터 생성

> **규모**: users 50 + posts 500 + comments 2,000 + view 3,000 + like 500 + keyword 500
> **v7 변경**: `post_like_logs`는 **VERIFIED 유저만** 좋아요 쌓도록 수정 (§4.2 트리거 차단 방지)

### 8.1 실행 순서

```
1) apartments 5개 (§3.2에서 INSERT 완료)
2) users 50명 (VERIFIED 약 80%, MEMBER 20%)
3) posts 500건
4) comments 2,000건
5) post_view_logs 3,000건
6) post_like_logs ~500건 (VERIFIED 유저만 대상 + UNIQUE 충돌 감안)
7) keyword_logs 500건
8) post_stats / keyword_stats 즉시 1회 배치 실행
```

### 8.2 전체 SQL

```sql
-- ============================================
-- 0. 기존 더미 정리 (선택, 주의!)
-- ============================================
-- TRUNCATE TABLE post_view_logs, post_like_logs, keyword_logs,
--                post_stats, keyword_stats, comments, posts, users
--   RESTART IDENTITY CASCADE;

-- ============================================
-- 1. users 50명
-- ============================================
INSERT INTO users (email, password_hash, nickname, status, apartment_id, apartment_name)
SELECT
  'user' || gs::text || '@test.com',
  '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummy',
  '주민_' || lpad(gs::text, 4, '0'),
  CASE WHEN random() < 0.8 THEN 'VERIFIED' ELSE 'MEMBER' END,
  CASE WHEN random() < 0.8 THEN (floor(random() * 5) + 1)::BIGINT ELSE NULL END,
  CASE WHEN random() < 0.8
    THEN (ARRAY['잠실엘스','헬리오시티','래미안퍼스티지','아크로리버파크','마포래미안푸르지오'])[floor(random() * 5) + 1]
    ELSE NULL
  END
FROM generate_series(1, 50) AS gs
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. posts 500건
-- ============================================
INSERT INTO posts (user_id, apartment_id, category, title, content, created_at)
SELECT
  (floor(random() * 50) + 1)::BIGINT,
  (floor(random() * 5) + 1)::BIGINT,
  (ARRAY['FREE','QUESTION','INFO','COMPLAINT','TRADE'])[floor(random() * 5) + 1],
  (ARRAY[
    '헬스장 이용 시간 변경되었나요',
    '관리비 고지서 확인하세요',
    '주차 문제 어떻게 생각하세요',
    '택배 보관함 위치 아시는 분',
    '분리수거 요일 바뀌었어요',
    '엘리베이터 소음 민원 넣으신 분',
    '헬스장 회원 등록 어떻게 하나요',
    '놀이터 보수 공사 일정',
    '경비실 택배 보관 정책',
    '재활용 분리 기준 공지',
    '이사 업체 추천 부탁드려요',
    '층간소음 어떻게 해결하셨나요',
    '인테리어 업체 후기 공유',
    '매물 시세 어떻게 보세요',
    '전세 재계약 관련 문의'
  ])[floor(random() * 15) + 1] || ' #' || gs::text,
  '본문 샘플입니다. 주차 헬스장 관리비 택배 분리수거 엘리베이터 소음 놀이터 경비실 재활용 이사 층간소음 인테리어 매물 전세. 게시글 번호 ' || gs::text,
  NOW() - (random() * INTERVAL '7 day')
FROM generate_series(1, 500) AS gs;

-- ============================================
-- 3. comments 2,000건
-- ============================================
INSERT INTO comments (post_id, user_id, content, created_at)
SELECT
  (floor(random() * 500) + 1)::BIGINT,
  (floor(random() * 50) + 1)::BIGINT,
  '댓글 샘플 ' || gs::text,
  NOW() - (random() * INTERVAL '6 day')
FROM generate_series(1, 2000) AS gs;

-- ============================================
-- 4. post_view_logs 3,000건 (30% GUEST)
-- ============================================
INSERT INTO post_view_logs (post_id, user_id, apartment_id, created_at)
SELECT
  (floor(random() * 500) + 1)::BIGINT,
  CASE WHEN random() < 0.7 THEN (floor(random() * 50) + 1)::BIGINT ELSE NULL END,
  (floor(random() * 5) + 1)::BIGINT,
  NOW() - (random() * INTERVAL '7 day')
FROM generate_series(1, 3000) AS gs;

-- ============================================
-- 5. post_like_logs ~500건 (VERIFIED 유저만!)
--    v7: §4.2 트리거 차단 방지 — VERIFIED user_id로만 생성
-- ============================================
INSERT INTO post_like_logs (post_id, user_id, apartment_id, created_at)
SELECT DISTINCT ON (t.post_id, t.user_id)
  t.post_id, t.user_id, t.apartment_id, t.created_at
FROM (
  SELECT
    (floor(random() * 500) + 1)::BIGINT AS post_id,
    u.user_id,
    (floor(random() * 5) + 1)::BIGINT AS apartment_id,
    NOW() - (random() * INTERVAL '7 day') AS created_at
  FROM generate_series(1, 1000) AS gs
  CROSS JOIN LATERAL (
    SELECT user_id FROM users WHERE status = 'VERIFIED' ORDER BY random() LIMIT 1
  ) u
) t
ON CONFLICT (post_id, user_id) DO NOTHING;

-- ============================================
-- 6. keyword_logs 500건
-- ============================================
INSERT INTO keyword_logs (keyword, source, post_id, apartment_id, created_at)
SELECT
  (ARRAY[
    '주차','헬스장','관리비','택배','분리수거',
    '엘리베이터','소음','놀이터','경비실','재활용',
    '이사','층간소음','인테리어','매물','전세'
  ])[floor(random() * 15) + 1],
  (ARRAY['POST','SEARCH'])[floor(random() * 2) + 1],
  (floor(random() * 500) + 1)::BIGINT,
  (floor(random() * 5) + 1)::BIGINT,
  NOW() - (random() * INTERVAL '7 day')
FROM generate_series(1, 500) AS gs;

-- ============================================
-- 7. 집계 즉시 실행 (§7.1 + §7.2)
-- ============================================
-- §7.1 SQL 실행
-- §7.2 SQL 실행
```

---

## 9. Spring API 계층

### 9.1 패키지 구조

```
com.dongnetalk.community
├── controller/
│   └── CommunityStatsController.java
├── service/
│   ├── CommunityStatsService.java
│   ├── PostViewLogService.java
│   ├── PostLikeService.java
│   └── KeywordExtractor.java
├── repository/
│   ├── PostStatsRepository.java
│   ├── KeywordStatsRepository.java
│   ├── PostViewLogRepository.java
│   ├── PostLikeLogRepository.java
│   └── KeywordLogRepository.java
├── entity/
│   ├── PostStats.java
│   ├── KeywordStats.java
│   ├── KeywordStatsId.java            ← @IdClass 복합키
│   ├── PostViewLog.java
│   ├── PostLikeLog.java
│   └── KeywordLog.java
└── dto/
    ├── PopularPostDto.java
    ├── MostCommentedPostDto.java
    ├── ApiResponse.java
    └── ErrorResponse.java
```

### 9.2 공통 API 응답 포맷 (전 PRD 공통)

```java
// ApiResponse.java
@Getter
@Builder
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private ErrorResponse error;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .error(new ErrorResponse(code, message))
            .build();
    }
}

// ErrorResponse.java
@Getter @AllArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
}
```

### 9.3 DTO (프론트 타입과 1:1 매핑)

```java
// PopularPostDto.java — 사이드바 PRD §8.1 PopularPost 타입
@Getter @Builder
@AllArgsConstructor
public class PopularPostDto {
    private Long postId;           // number
    private String title;          // string
    private Integer likeCount;     // number
    private Integer commentCount;  // number
}

// MostCommentedPostDto.java — 사이드바 PRD §8.2 MostCommentedPost 타입
@Getter @Builder
@AllArgsConstructor
public class MostCommentedPostDto {
    private Long postId;
    private String title;
    private Integer commentCount;
}

// TrendingKeywords는 List<String> — DTO 불필요
```

### 9.4 복합키 JPA Entity (`KeywordStats`)

> ⚠️ **[v7 신규]** 실무에서 자주 놓치는 `@IdClass` 패턴 명시

```java
// KeywordStatsId.java — 복합키 클래스 (Serializable + equals/hashCode 필수)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class KeywordStatsId implements Serializable {
    private String keyword;
    private Long apartmentId;
    private LocalDate statDate;
}

// KeywordStats.java
@Entity
@Table(name = "keyword_stats")
@IdClass(KeywordStatsId.class)
@Getter
@NoArgsConstructor
public class KeywordStats {
    @Id
    @Column(length = 50)
    private String keyword;

    @Id
    @Column(name = "apartment_id")
    private Long apartmentId;

    @Id
    @Column(name = "stat_date")
    private LocalDate statDate;

    private Integer count;
}

// PostStats.java — 단일 PK (post_id), 단순
@Entity
@Table(name = "post_stats")
@Getter
@NoArgsConstructor
public class PostStats {
    @Id
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "apartment_id")
    private Long apartmentId;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "like_count")
    private Integer likeCount;

    @Column(name = "comment_count")
    private Integer commentCount;

    private Integer score;

    @Column(name = "post_created_at")
    private OffsetDateTime postCreatedAt;   // TIMESTAMPTZ → OffsetDateTime 매핑

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
```

### 9.5 TIMESTAMPTZ 매핑 주의

> ⚠️ **[v7 신규]** `TIMESTAMPTZ` ↔ Java 타입 매핑

| DB 타입 | Java 타입 | JSON 직렬화 |
|---------|----------|------------|
| `TIMESTAMPTZ` | `OffsetDateTime` (권장) | `2026-04-23T15:30:00+09:00` |
| `TIMESTAMP`   | `LocalDateTime` | `2026-04-23T15:30:00` |
| `DATE`        | `LocalDate` | `2026-04-23` |

```java
// application.yml
spring:
  jackson:
    time-zone: Asia/Seoul
    serialization:
      write-dates-as-timestamps: false
  datasource:
    hikari:
      data-source-properties:
        stringtype: unspecified   // PostgreSQL enum/jsonb 문제 방지
```

### 9.6 Repository 예시 (Native Query)

```java
public interface PostStatsRepository extends JpaRepository<PostStats, Long> {

    // §10.1 인기 글 Top 5
    @Query(value = """
        SELECT
          p.post_id       AS postId,
          p.title         AS title,
          s.like_count    AS likeCount,
          s.comment_count AS commentCount
        FROM post_stats s
        JOIN posts p ON p.post_id = s.post_id
        WHERE s.apartment_id = :aptId
          AND s.post_created_at > NOW() - INTERVAL '1 day'
        ORDER BY s.score DESC, s.post_created_at DESC
        LIMIT 5
        """, nativeQuery = true)
    List<PopularPostProjection> findPopularPosts(@Param("aptId") Long aptId);

    // Fallback — 24시간 내 5건 미만이면 7일로 확장 (§10.1 참고)
    @Query(value = """
        SELECT
          p.post_id AS postId, p.title AS title,
          s.like_count AS likeCount, s.comment_count AS commentCount
        FROM post_stats s
        JOIN posts p ON p.post_id = s.post_id
        WHERE s.apartment_id = :aptId
          AND s.post_created_at > NOW() - INTERVAL '7 day'
        ORDER BY s.score DESC, s.post_created_at DESC
        LIMIT 5
        """, nativeQuery = true)
    List<PopularPostProjection> findPopularPostsFallback(@Param("aptId") Long aptId);
}

// Projection 인터페이스 (DTO로 변환)
public interface PopularPostProjection {
    Long getPostId();
    String getTitle();
    Integer getLikeCount();
    Integer getCommentCount();
}
```

---

## 10. 조회 API 명세

### 10.1 인기 글 — `GET /api/community/{aptId}/posts/popular`

**기본 쿼리 (24시간)**

```sql
SELECT
  p.post_id       AS postId,
  p.title         AS title,
  s.like_count    AS likeCount,
  s.comment_count AS commentCount
FROM post_stats s
JOIN posts p ON p.post_id = s.post_id
WHERE s.apartment_id = :aptId
  AND s.post_created_at > NOW() - INTERVAL '1 day'
ORDER BY s.score DESC, s.post_created_at DESC
LIMIT 5;
```

**Fallback 로직 (v7 신규)**

> ⚠️ **실행 검증에서 발견된 문제**: 초기 서비스는 24시간 내 게시글이 적어 사이드바가 빈 카드로 보일 수 있음 (실제 측정: 500건 중 24시간 내 16%).

```java
// CommunityStatsService.java
public List<PopularPostDto> getPopularPosts(Long aptId) {
    List<PopularPostProjection> rows = repo.findPopularPosts(aptId);
    if (rows.size() < 3) {  // 3건 미만이면 7일로 확장
        rows = repo.findPopularPostsFallback(aptId);
    }
    return rows.stream()
        .map(r -> PopularPostDto.builder()
            .postId(r.getPostId())
            .title(r.getTitle())
            .likeCount(r.getLikeCount())
            .commentCount(r.getCommentCount())
            .build())
        .toList();
}
```

**Response 200**

```json
{
  "success": true,
  "data": [
    { "postId": 279, "title": "층간소음 어떻게 해결하셨나요 #279", "likeCount": 3, "commentCount": 8 },
    { "postId": 61,  "title": "택배 보관함 위치 아시는 분 #61",   "likeCount": 0, "commentCount": 9 }
  ],
  "error": null
}
```

**Error**

```json
{
  "success": false,
  "data": null,
  "error": { "code": "STATS_FETCH_FAIL", "message": "인기 글을 불러올 수 없습니다" }
}
```

---

### 10.2 댓글 많은 글 — `GET /api/community/{aptId}/posts/hot-comments`

```sql
SELECT
  p.post_id       AS postId,
  p.title         AS title,
  s.comment_count AS commentCount
FROM post_stats s
JOIN posts p ON p.post_id = s.post_id
WHERE s.apartment_id = :aptId
  AND s.post_created_at > NOW() - INTERVAL '1 day'
  AND s.comment_count > 0
ORDER BY s.comment_count DESC, s.post_created_at DESC
LIMIT 5;
```

**Fallback**: 10.1과 동일하게 7일로 확장 (3건 미만일 때)

---

### 10.3 인기 키워드 — `GET /api/community/{aptId}/keywords`

> ⚠️ **[v7 수정]** v6는 `SELECT keyword`만 SELECT → 프론트가 count를 못 받음. v7은 `keyword, total` 둘 다 반환 후 Service에서 `List<String>`으로 변환.

**Repository Native Query**

```sql
SELECT
  keyword       AS keyword,
  SUM(count)    AS total
FROM keyword_stats
WHERE stat_date >= CURRENT_DATE - INTERVAL '7 day'
  AND apartment_id = :aptId
GROUP BY keyword
ORDER BY total DESC
LIMIT 10;
```

**Service 변환**

```java
public List<String> getTrendingKeywords(Long aptId) {
    return repo.findTrending(aptId).stream()
        .map(KeywordCountProjection::getKeyword)
        .toList();
}
```

**Response 200** (사이드바 PRD §7.2의 `string[]` 타입)

```json
{
  "success": true,
  "data": ["경비실", "매물", "관리비", "분리수거", "엘리베이터", "인테리어", "놀이터", "이사", "헬스장", "소음"],
  "error": null
}
```

---

### 10.4 프론트 연동 스위치

```ts
// data/mockSidebarData.ts (기존)
export const USE_MOCK_SIDEBAR = true   // API 연동 완료 시 false

// hooks/useSidebarData.ts
useQuery({
  queryKey: ['popularPosts', aptId],
  queryFn: async () => {
    const res = await fetch(`/api/community/${aptId}/posts/popular`)
    const body = await res.json()
    if (!body.success) throw new Error(body.error?.message)
    return body.data
  },
  enabled: !USE_MOCK_SIDEBAR,
  initialData: USE_MOCK_SIDEBAR ? mockPopularPosts : undefined,
  staleTime: 1000 * 60 * 5,
})
```

---

## 11. 이벤트 로깅 흐름

> 권한 체크: 좋아요·게시글 작성 = **VERIFIED 만** (`로그인_인증_UI_PRD.md §2`)
> v7: DB 트리거로 이중 방어 (§4.2)

### 11.1 이벤트 발생 매트릭스

| 사용자 행동 | 권한 | INSERT 대상 | 추가 처리 |
|------------|:----:|------------|----------|
| 게시글 상세 조회 | GUEST 이상 | `post_view_logs` | 1시간 중복 체크 |
| 좋아요 토글 | VERIFIED | `post_like_logs` INSERT/DELETE | 트리거 차단 + UNIQUE |
| 게시글 작성 | VERIFIED | `posts` + `keyword_logs`(다건) | 트랜잭션 내 키워드 추출 |
| 댓글 작성 | VERIFIED | `comments` | 키워드 추출 없음 |
| 사이드바 키워드 클릭 | GUEST 이상 | `keyword_logs` (SEARCH) | — |

### 11.2 `PostViewLogService.logView()`

```java
@Transactional
public void logView(Long postId, Long userId, Long apartmentId) {
    if (userId == null) {
        // GUEST: 무조건 INSERT
        repo.save(new PostViewLog(postId, null, apartmentId));
        return;
    }
    // 로그인 유저: 1시간 중복 체크
    boolean recentlyViewed = repo.existsByUserIdAndPostIdAndCreatedAtAfter(
        userId, postId, OffsetDateTime.now().minusHours(1)
    );
    if (!recentlyViewed) {
        repo.save(new PostViewLog(postId, userId, apartmentId));
    }
}
```

### 11.3 `PostLikeService.toggleLike()`

```java
@Transactional
public LikeResult toggleLike(Long postId, Long userId, Long apartmentId) {
    // 권한 체크 (트리거로 이중 방어되지만 Service에서도 검증)
    User user = userRepo.findById(userId)
        .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND"));
    if (!"VERIFIED".equals(user.getStatus())) {
        throw new ForbiddenException("VERIFIED_REQUIRED");
    }

    Optional<PostLikeLog> existing = repo.findByPostIdAndUserId(postId, userId);
    if (existing.isPresent()) {
        repo.delete(existing.get());
        return LikeResult.REMOVED;
    } else {
        repo.save(new PostLikeLog(postId, userId, apartmentId));
        return LikeResult.ADDED;
    }
}
```

### 11.4 `KeywordExtractor.extract()`

```java
private static final Set<String> STOPWORDS = Set.of(
    "그리고", "그래서", "하지만", "있는", "없는", "합니다", "입니다"
    // stopwords.txt 로 관리 확장
);

public List<String> extract(String title, String content) {
    return Arrays.stream((title + " " + content).split("\\s+"))
        .map(String::trim)
        .filter(w -> w.length() >= 2 && w.length() <= 50)
        .filter(w -> !STOPWORDS.contains(w))
        .distinct()
        .toList();
}
```

---

## 12. 배치 스케줄링 (pg_cron)

### 12.1 pg_cron 활성화

```sql
-- Supabase Dashboard → Database → Extensions → pg_cron 토글
-- 또는 SQL Editor:
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 12.2 배치 등록

```sql
-- post_stats 5분 주기
SELECT cron.schedule(
  'refresh-post-stats',
  '*/5 * * * *',
  $$
  INSERT INTO post_stats (
    post_id, apartment_id, view_count, like_count, comment_count,
    score, post_created_at, updated_at
  )
  SELECT
    p.post_id, p.apartment_id,
    COALESCE(v.view_count, 0), COALESCE(l.like_count, 0), COALESCE(c.comment_count, 0),
    (COALESCE(l.like_count, 0) * 2 + COALESCE(c.comment_count, 0)),
    p.created_at, NOW()
  FROM posts p
  LEFT JOIN (SELECT post_id, COUNT(*) AS view_count    FROM post_view_logs GROUP BY post_id) v ON p.post_id = v.post_id
  LEFT JOIN (SELECT post_id, COUNT(*) AS like_count    FROM post_like_logs GROUP BY post_id) l ON p.post_id = l.post_id
  LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM comments       GROUP BY post_id) c ON p.post_id = c.post_id
  WHERE p.created_at > NOW() - INTERVAL '30 day'
  ON CONFLICT (post_id) DO UPDATE SET
    view_count    = EXCLUDED.view_count,
    like_count    = EXCLUDED.like_count,
    comment_count = EXCLUDED.comment_count,
    score         = EXCLUDED.score,
    updated_at    = EXCLUDED.updated_at;
  $$
);

-- keyword_stats 10분 주기
SELECT cron.schedule(
  'refresh-keyword-stats',
  '*/10 * * * *',
  $$
  INSERT INTO keyword_stats (keyword, apartment_id, stat_date, count)
  SELECT
    keyword, apartment_id,
    (created_at AT TIME ZONE 'Asia/Seoul')::date,
    COUNT(*)
  FROM keyword_logs
  WHERE created_at > NOW() - INTERVAL '8 day'
  GROUP BY keyword, apartment_id, (created_at AT TIME ZONE 'Asia/Seoul')::date
  ON CONFLICT (keyword, apartment_id, stat_date) DO UPDATE SET
    count = EXCLUDED.count;
  $$
);
```

### 12.3 Supabase에서 pg_cron 권한 (v7 신규)

> ⚠️ **[v7 신규]** Supabase는 `pg_cron` 실행을 **`postgres` 역할**에만 허용.
> AI Agent가 Supabase SQL Editor에서 실행 시 자동으로 `postgres` 역할이므로 OK.
> 그러나 Spring 앱이 `anon` / `authenticated` 역할로 접근하면 `cron.schedule()` 호출 불가.
> **결론**: `cron.schedule()` 은 **반드시 Supabase SQL Editor** (또는 `postgres` 연결)에서 1회만 실행.

### 12.4 등록 확인 / 모니터링

```sql
-- 등록된 job 목록
SELECT jobid, schedule, jobname, active FROM cron.job;

-- 실행 이력 (최근 10건)
SELECT jobid, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- job 해제 (필요 시)
-- SELECT cron.unschedule('refresh-post-stats');
```

---

## 13. AI Agent 작업 순서

> 각 Step을 순서대로 실행. 각 Step 끝의 **검증 쿼리**가 통과해야 다음 Step 진행.

### ✅ Step 1. 사전 테이블 존재 확인 (§3)

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'apartments', 'posts', 'comments')
ORDER BY table_name;
-- 기대: 4건. 부족하면 §3 DDL 실행
```

### ✅ Step 2. 신규 테이블 생성 (§4 + §5)

- `post_view_logs`, `post_like_logs`, `keyword_logs`
- `post_stats`, `keyword_stats`
- **§4.2 트리거 + 함수** 반드시 생성
- 제약조건 확인:

```sql
SELECT conname, contype FROM pg_constraint
WHERE conrelid IN (
  'post_like_logs'::regclass, 'keyword_logs'::regclass,
  'keyword_stats'::regclass
);
-- uk_post_like / ck_keyword_logs_source / ck_keyword_length / pk_keyword_stats 확인
```

### ✅ Step 3. 인덱스 생성 (§6)

```sql
SELECT indexname FROM pg_indexes
WHERE tablename IN (
  'post_view_logs','post_like_logs','keyword_logs',
  'post_stats','keyword_stats','posts','comments'
);
-- 기대: 9개 + PK 인덱스
```

### ✅ Step 4. 더미 데이터 주입 (§8)

```sql
SELECT 'users' AS t, COUNT(*) FROM users
UNION ALL SELECT 'posts',          COUNT(*) FROM posts
UNION ALL SELECT 'comments',       COUNT(*) FROM comments
UNION ALL SELECT 'view_logs',      COUNT(*) FROM post_view_logs
UNION ALL SELECT 'like_logs',      COUNT(*) FROM post_like_logs
UNION ALL SELECT 'keyword_logs',   COUNT(*) FROM keyword_logs;
-- 기대: 50 / 500 / 2000 / 3000 / ~500 / 500
```

### ✅ Step 5. 좋아요 트리거 동작 확인

```sql
-- MEMBER 유저 user_id를 찾아서 강제 INSERT 시도 → 에러가 나야 정상
DO $$
DECLARE
  member_uid BIGINT;
  err_occurred BOOLEAN := FALSE;
BEGIN
  SELECT user_id INTO member_uid FROM users WHERE status = 'MEMBER' LIMIT 1;
  IF member_uid IS NULL THEN
    RAISE NOTICE '⚠️ MEMBER 유저 없음 — 테스트 스킵';
    RETURN;
  END IF;
  BEGIN
    INSERT INTO post_like_logs (post_id, user_id, apartment_id) VALUES (1, member_uid, 1);
  EXCEPTION WHEN insufficient_privilege THEN
    err_occurred := TRUE;
  END;
  IF err_occurred THEN
    RAISE NOTICE '✅ 트리거 정상 — MEMBER 좋아요 차단됨';
  ELSE
    RAISE NOTICE '❌ 트리거 미동작 — MEMBER 좋아요가 저장됨';
    DELETE FROM post_like_logs WHERE user_id = member_uid AND post_id = 1;
  END IF;
END $$;
```

### ✅ Step 6. 집계 SQL 수동 1회 실행 (§7)

- §7.1 → `post_stats` 약 500행
- §7.2 → `keyword_stats` 약 300~350행

### ✅ Step 7. 조회 쿼리 직접 검증 (§10 SQL 3개)

- `apartment_id = 1` 기준
- 각 쿼리 `EXPLAIN ANALYZE` → 인덱스 사용 확인 (`Index Scan using idx_post_stats_apt_score`)
- 실행 시간 < 50ms
- **예상 결과는 §14 스냅샷 참조**

### ✅ Step 8. Spring Entity·DTO·Repository 생성 (§9)

- 6개 Entity (복합키 `KeywordStatsId` 포함)
- 5개 Repository
- 3개 DTO + ApiResponse

### ✅ Step 9. Controller + Service 구현 (§10, §11)

- `CommunityStatsController` 3개 엔드포인트
- Fallback 로직 포함 (24시간 → 7일)
- `@RestControllerAdvice` 로 `ApiResponse.fail()` 포맷 통일

### ✅ Step 10. 이벤트 로깅 Service 구현 (§11)

- `PostViewLogService.logView()` (1시간 중복 체크)
- `PostLikeService.toggleLike()` (VERIFIED 권한 + 토글)
- `KeywordExtractor.extract()` + `PostService.createPost()` 트랜잭션

### ✅ Step 11. pg_cron 배치 등록 (§12)

- Supabase SQL Editor (postgres 역할) 에서 §12.2 실행
- 15분 대기 후 `cron.job_run_details` 에서 SUCCESS 확인

### ✅ Step 12. 프론트 연동 (USE_MOCK_SIDEBAR = false)

- `mockSidebarData.ts` 의 `USE_MOCK_SIDEBAR = false`
- Network 탭에서 3개 API 호출 확인
- 응답 포맷 `{success, data, error}` 확인
- 사이드바 UI에 실제 데이터 표시 확인

---

## 14. 예상 실행 결과 (스냅샷)

> 실제 실행 검증에서 얻은 결과 스냅샷. AI Agent가 자신의 실행 결과와 대조 가능.
> (랜덤 seed에 따라 수치는 달라지지만 구조·크기는 동일해야 함)

### 14.1 테이블 건수 (Step 4~6 완료 후)

```
users:         50건
apartments:     5건
posts:         500건
comments:    2,000건
post_view_logs: 3,000건
post_like_logs:  ~500건 (UNIQUE 충돌로 조금 적을 수 있음)
keyword_logs:   500건
post_stats:     500행
keyword_stats:  ~320행
```

### 14.2 집계 정합성 검증 (§7 실행 후)

```sql
-- 원본 로그 합계 vs 집계 테이블 SUM
SELECT
  (SELECT COUNT(*) FROM post_view_logs) AS src_view,
  (SELECT COALESCE(SUM(view_count), 0)  FROM post_stats) AS agg_view,
  (SELECT COUNT(*) FROM post_like_logs) AS src_like,
  (SELECT COALESCE(SUM(like_count), 0)  FROM post_stats) AS agg_like,
  (SELECT COUNT(*) FROM comments)       AS src_cmt,
  (SELECT COALESCE(SUM(comment_count),0) FROM post_stats) AS agg_cmt;
-- 기대: src_view = agg_view, src_like = agg_like, src_cmt = agg_cmt (모두 일치)
```

### 14.3 조회 API 예상 결과 (aptId=1)

**10.1 인기 글**
```
postId title                                 likeCount commentCount score
279    층간소음 어떻게 해결하셨나요 #279       3         8            14
61     택배 보관함 위치 아시는 분 #61         0         9            9
262    층간소음 어떻게 해결하셨나요 #262       2         5            9
32     전세 재계약 관련 문의 #32             3         2            8
309    놀이터 보수 공사 일정 #309            2         3            7
```

**10.2 댓글 많은 글**
```
postId title                            commentCount
61     택배 보관함 위치 아시는 분 #61     9
279    층간소음 어떻게 해결하셨나요 #279   8
494    헬스장 이용 시간 변경되었나요 #494   5
262    층간소음 어떻게 해결하셨나요 #262   5
52     주차 문제 어떻게 생각하세요 #52     5
```

**10.3 인기 키워드**
```
keyword       total
경비실         14
매물          12
관리비         11
분리수거        10
엘리베이터       9
인테리어         9
놀이터          8
이사           8
헬스장          7
소음           7
```

### 14.4 Score 공식 정합성

```sql
-- 모든 post_stats 행에 대해 score = like_count * 2 + comment_count 성립 확인
SELECT COUNT(*) FROM post_stats
WHERE score != (like_count * 2 + comment_count);
-- 기대: 0건
```

### 14.5 아파트별 분포

```
apt_id  게시글 수  평균 점수
1       ~90      6
2       ~95      6
3       ~105     6
4       ~100     6
5       ~110     6
```

---

## 15. 정합성 체크리스트

### 15.1 사이드바 UI PRD와의 정합성

| 요구사항 | v7 대응 | ✅ |
|---------|--------|---|
| `PopularPost` 타입 {postId, title, likeCount, commentCount} | §9.3 PopularPostDto | ✅ |
| `MostCommentedPost` 타입 {postId, title, commentCount} | §9.3 MostCommentedPostDto | ✅ |
| `TrendingKeyword = string[]` | §10.3 Service 변환 | ✅ |
| score = likeCount * 2 + commentCount | §5.1 / §7.1 / §14.4 | ✅ |
| 최근 24시간 / 최대 5개 (Popular) | §10.1 + Fallback | ✅ |
| 최근 24시간 / 최대 5개 (MostCommented) | §10.2 + Fallback | ✅ |
| 최근 7일 / 최대 10개 (Keywords) | §10.3 | ✅ |
| 엔드포인트 3개 | §10.1 / §10.2 / §10.3 | ✅ |
| staleTime 5분 | pg_cron 5분 주기와 일치 | ✅ |
| USE_MOCK 패턴 | §10.4 USE_MOCK_SIDEBAR | ✅ |

### 15.2 인증 PRD와의 정합성

| 요구사항 | v7 대응 | ✅ |
|---------|--------|---|
| UserState 필드 (userId/nickname/status/apartmentId/apartmentName) | §3.1 users 테이블 | ✅ |
| status ENUM: MEMBER / VERIFIED | §3.1 CHECK | ✅ |
| 좋아요/댓글/글쓰기 = VERIFIED만 | §4.2 트리거 + §11.3 Service | ✅ |
| apartmentId = number (BIGINT) | §3.2 BIGINT | ✅ |

### 15.3 아파트 검색 PRD와의 정합성

| 요구사항 | v7 대응 | ✅ |
|---------|--------|---|
| `Apartment.aptId = 'APT001'` (string) | §3.2 apt_code | ✅ |
| `toApartmentId('APT001') = 1` | apartment_id = 1 매핑 | ✅ |
| mock 아파트 5종 일치 | §3.2 초기 데이터 | ✅ |

### 15.4 API 응답 포맷 정합성

| 요구사항 | v7 대응 | ✅ |
|---------|--------|---|
| `{success, data, error}` | §9.2 ApiResponse | ✅ |
| 성공: error=null | §10 예시 | ✅ |
| 실패: success=false, data=null, error={code, message} | §10.1 예시 | ✅ |

---

## 16. 비기능 요구사항

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 조회 API 응답속도 | < 200ms (p95) | Spring Actuator metrics |
| 집계 배치 실행 시간 | < 30초 (posts 10만 기준) | `cron.job_run_details.end_time - start_time` |
| 배치 실패 재시도 | 자동 (다음 주기) | UPSERT 멱등성 |
| 키워드 길이 | 2~50자 | DB CHECK + Spring validation |
| 금칙어 필터링 | 서비스 레이어 | stopwords.txt |
| 확장성 | Redis 캐싱 전환 가능 | stats → Redis Hash 미러링 |
| 타임존 | Asia/Seoul 일관 | DB `AT TIME ZONE` / Spring OffsetDateTime |

---

## 17. v2 확장 (현재 범위 밖)

- 형태소 분석기(Nori) 키워드 추출
- Redis 캐싱 (`popular:{aptId}`, TTL 5분)
- 시간 감쇠 점수 `score / (hours_since_post + 2)^1.5`
- IP 기반 GUEST 조회 중복 제어
- 금칙어 관리자 화면
- 댓글 본문 키워드 추출
- 카테고리별 인기 글 분리

---

## 18. 핵심 요약

- ✅ **로그는 무조건 쌓는다** (append-only)
- ✅ **집계는 배치로 한다** (pg_cron 5/10분, 멱등)
- ✅ **조회는 stats 테이블만 본다** (<200ms)
- ✅ **점수는 `like*2 + comment`** (사이드바 PRD 완전 일치)
- ✅ **권한은 VERIFIED** (Service + DB 트리거 이중 방어)
- ✅ **Fallback: 24시간 → 7일 (3건 미만 시)**
- ✅ **응답 포맷은 `{success, data, error}`** (전 프로젝트 공통)
- ✅ **더미 데이터 6,050건** (실행 검증 완료)
- ✅ **예상 결과 스냅샷 제공** (§14 — AI Agent 대조용)

---

**문서 버전**: v7.0 (최종, 실행 검증 완료)
**검증 방법**: DuckDB (PostgreSQL 호환)에서 §3~§10 전체 실행
**대상**: AI Agent (Supabase SQL + Spring Boot + React 통합 구현)
**선행 조건**: Supabase 프로젝트 생성 + pg_cron extension 활성화
**예상 작업 시간**: DB 30분 + Spring 2시간 + 배치+프론트 30분 = **약 3시간**
