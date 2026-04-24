-- ============================================================
-- V5: 커뮤니티 집계 시스템 테이블 + 더미 데이터 + 초기 집계
-- (V4가 DB에 기록만 되고 실제 테이블 생성이 누락된 경우를 보정)
-- IF NOT EXISTS 사용 → 이미 존재하는 테이블/인덱스는 무시
-- ============================================================

-- ── 1. 테이블 생성 ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comments (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_nickname VARCHAR(60) NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_view_logs (
    id         BIGSERIAL PRIMARY KEY,
    post_id    BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    apt_id     BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_like_logs (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_nickname VARCHAR(60) NOT NULL,
    apt_id          BIGINT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_post_like UNIQUE (post_id, author_nickname)
);

CREATE TABLE IF NOT EXISTS keyword_logs (
    id         BIGSERIAL PRIMARY KEY,
    keyword    VARCHAR(50) NOT NULL,
    source     VARCHAR(20) NOT NULL,
    post_id    BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    apt_id     BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_keyword_logs_source CHECK (source IN ('POST', 'SEARCH')),
    CONSTRAINT ck_keyword_length CHECK (char_length(keyword) BETWEEN 2 AND 50)
);

CREATE TABLE IF NOT EXISTS post_stats (
    post_id         BIGINT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    apt_id          BIGINT NOT NULL,
    view_count      INT NOT NULL DEFAULT 0,
    like_count      INT NOT NULL DEFAULT 0,
    comment_count   INT NOT NULL DEFAULT 0,
    score           INT NOT NULL DEFAULT 0,
    post_created_at TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyword_stats (
    keyword   VARCHAR(50) NOT NULL,
    apt_id    BIGINT NOT NULL,
    stat_date DATE NOT NULL,
    count     INT NOT NULL DEFAULT 0,
    CONSTRAINT pk_keyword_stats PRIMARY KEY (keyword, apt_id, stat_date)
);

-- ── 2. 인덱스 ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_view_logs_post_created   ON post_view_logs(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_like_logs_post           ON post_like_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post            ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_keyword_logs_apt_created ON keyword_logs(apt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_stats_apt_score     ON post_stats(apt_id, score DESC, post_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_stats_apt_comment   ON post_stats(apt_id, comment_count DESC, post_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_stats_created       ON post_stats(post_created_at);
CREATE INDEX IF NOT EXISTS idx_keyword_stats_apt_date   ON keyword_stats(apt_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created    ON comments(post_id, created_at DESC);

-- ── 3. 더미 데이터 (posts가 50개 미만일 때만 삽입) ───────────────

DO $$
DECLARE
    apt_id_arr   BIGINT[];
    apt_name_arr TEXT[];
    apt_count    INT;
    post_id_arr  BIGINT[];
    n_posts      INT;
BEGIN
    SELECT COUNT(*) INTO n_posts FROM posts;
    IF n_posts >= 50 THEN
        RAISE NOTICE '게시글이 이미 % 개 존재하여 더미 데이터 삽입을 건너뜁니다.', n_posts;
        RETURN;
    END IF;

    SELECT
        ARRAY(SELECT id           FROM apartment ORDER BY id LIMIT 5),
        ARRAY(SELECT complex_name FROM apartment ORDER BY id LIMIT 5)
    INTO apt_id_arr, apt_name_arr;

    apt_count := COALESCE(array_length(apt_id_arr, 1), 0);
    IF apt_count = 0 THEN
        RAISE EXCEPTION '아파트 테이블에 데이터가 없습니다.';
    END IF;

    -- 500 게시글
    INSERT INTO posts (apt_id, category, title, content, author_nickname, complex_name, like_count, comment_count, created_at)
    SELECT
        apt_id_arr[sub.idx],
        (ARRAY['자유','질문','정보','민원','거래'])[(floor(random() * 5) + 1)::INT],
        (ARRAY[
            '헬스장 이용 시간 변경되었나요','관리비 고지서 확인하세요','주차 문제 어떻게 생각하세요',
            '택배 보관함 위치 아시는 분','분리수거 요일 바뀌었어요','엘리베이터 소음 민원 넣으신 분',
            '헬스장 회원 등록 어떻게 하나요','놀이터 보수 공사 일정','경비실 택배 보관 정책',
            '재활용 분리 기준 공지','이사 업체 추천 부탁드려요','층간소음 어떻게 해결하셨나요',
            '인테리어 업체 후기 공유','매물 시세 어떻게 보세요','전세 재계약 관련 문의'
        ])[(floor(random() * 15) + 1)::INT] || ' #' || sub.gs::TEXT,
        '본문 내용입니다. 주차 헬스장 관리비 택배 분리수거 엘리베이터 소음 놀이터 경비실 재활용 이사 층간소음 인테리어 매물 전세 관련해서 공유합니다. #' || sub.gs::TEXT,
        '익명_' || lpad((floor(random() * 9999) + 1)::INT::TEXT, 4, '0'),
        apt_name_arr[sub.idx],
        0, 0,
        NOW() - (random() * INTERVAL '7 days')
    FROM (
        SELECT gs, (floor(random() * apt_count) + 1)::INT AS idx
        FROM generate_series(1, 500) AS gs
    ) sub;

    SELECT ARRAY(SELECT id FROM posts ORDER BY id) INTO post_id_arr;
    n_posts := array_length(post_id_arr, 1);

    -- 2,000 댓글
    INSERT INTO comments (post_id, author_nickname, content, created_at)
    SELECT
        p.id,
        '익명_' || lpad((floor(random() * 9999) + 1)::INT::TEXT, 4, '0'),
        (ARRAY[
            '정말 유용한 정보네요!','저도 같은 생각이에요','감사합니다!','좋은 글 잘 읽었습니다',
            '도움이 되었어요','저희 단지도 그렇더라고요','관리사무소에 문의해보세요',
            '공감합니다!','좋은 정보 공유 감사해요','이런 문제가 있었군요'
        ])[(floor(random() * 10) + 1)::INT],
        NOW() - (random() * INTERVAL '6 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 2000)) sub
    JOIN posts p ON p.id = sub.pid;

    -- 3,000 조회 로그
    INSERT INTO post_view_logs (post_id, apt_id, created_at)
    SELECT p.id, p.apt_id, NOW() - (random() * INTERVAL '7 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 3000)) sub
    JOIN posts p ON p.id = sub.pid;

    -- ~500 좋아요 로그
    INSERT INTO post_like_logs (post_id, author_nickname, apt_id, created_at)
    SELECT p.id, '익명_' || lpad((floor(random() * 200) + 1)::INT::TEXT, 4, '0'), p.apt_id, NOW() - (random() * INTERVAL '7 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 1000)) sub
    JOIN posts p ON p.id = sub.pid
    ON CONFLICT (post_id, author_nickname) DO NOTHING;

    -- 500 키워드 로그
    INSERT INTO keyword_logs (keyword, source, post_id, apt_id, created_at)
    SELECT
        (ARRAY['주차','헬스장','관리비','택배','분리수거','엘리베이터','소음','놀이터','경비실','재활용','이사','층간소음','인테리어','매물','전세'])[(floor(random() * 15) + 1)::INT],
        CASE WHEN random() < 0.5 THEN 'POST' ELSE 'SEARCH' END,
        p.id, p.apt_id,
        NOW() - (random() * INTERVAL '7 days')
    FROM (SELECT post_id_arr[(floor(random() * n_posts) + 1)::INT] AS pid FROM generate_series(1, 500)) sub
    JOIN posts p ON p.id = sub.pid;

END $$;

-- ── 4. 초기 집계 ──────────────────────────────────────────────

INSERT INTO post_stats (post_id, apt_id, view_count, like_count, comment_count, score, post_created_at, updated_at)
SELECT
    p.id, p.apt_id,
    COALESCE(v.view_count, 0),
    COALESCE(l.like_count, 0),
    COALESCE(c.comment_count, 0),
    (COALESCE(l.like_count, 0) * 2 + COALESCE(c.comment_count, 0)),
    p.created_at,
    NOW()
FROM posts p
LEFT JOIN (SELECT post_id, COUNT(*) AS view_count    FROM post_view_logs GROUP BY post_id) v ON p.id = v.post_id
LEFT JOIN (SELECT post_id, COUNT(*) AS like_count    FROM post_like_logs GROUP BY post_id) l ON p.id = l.post_id
LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM comments       GROUP BY post_id) c ON p.id = c.post_id
WHERE p.created_at > NOW() - INTERVAL '30 days'
ON CONFLICT (post_id) DO UPDATE SET
    view_count    = EXCLUDED.view_count,
    like_count    = EXCLUDED.like_count,
    comment_count = EXCLUDED.comment_count,
    score         = EXCLUDED.score,
    updated_at    = EXCLUDED.updated_at;

INSERT INTO keyword_stats (keyword, apt_id, stat_date, count)
SELECT keyword, apt_id, created_at::DATE, COUNT(*)
FROM keyword_logs
WHERE created_at > NOW() - INTERVAL '8 days'
GROUP BY keyword, apt_id, created_at::DATE
ON CONFLICT (keyword, apt_id, stat_date) DO UPDATE SET count = EXCLUDED.count;

-- ── 5. posts 카운터 동기화 ────────────────────────────────────

UPDATE posts p
SET like_count    = s.like_count,
    comment_count = s.comment_count
FROM post_stats s
WHERE p.id = s.post_id;
