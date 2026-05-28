-- ============================================================
-- V16: GLOBAL/APARTMENT scope-aware community statistics
-- ============================================================
-- 목적:
-- 1. 공통게시판(GLOBAL)은 apt_id가 null일 수 있으므로 기존 apt_id 중심 집계 구조를 확장한다.
-- 2. 인기글/댓글 많은 글/키워드가 scope와 board_code를 섞지 않도록 집계 테이블에 게시판 차원을 저장한다.
-- 3. 기존 데이터는 posts 기준으로 backfill하여 기존 아파트별 게시판 회귀를 막는다.

-- ── 1. 이벤트 로그에 게시판 차원 추가 ─────────────────────────

ALTER TABLE post_view_logs
    ADD COLUMN IF NOT EXISTS board_scope VARCHAR(20),
    ADD COLUMN IF NOT EXISTS board_code VARCHAR(40);

ALTER TABLE post_like_logs
    ADD COLUMN IF NOT EXISTS board_scope VARCHAR(20),
    ADD COLUMN IF NOT EXISTS board_code VARCHAR(40);

ALTER TABLE keyword_logs
    ADD COLUMN IF NOT EXISTS board_scope VARCHAR(20),
    ADD COLUMN IF NOT EXISTS board_code VARCHAR(40);

UPDATE post_view_logs l
SET board_scope = p.board_scope,
    board_code = p.board_code
FROM posts p
WHERE l.post_id = p.id
  AND (l.board_scope IS NULL OR l.board_code IS NULL);

UPDATE post_like_logs l
SET board_scope = p.board_scope,
    board_code = p.board_code
FROM posts p
WHERE l.post_id = p.id
  AND (l.board_scope IS NULL OR l.board_code IS NULL);

UPDATE keyword_logs l
SET board_scope = COALESCE(p.board_scope, 'APARTMENT'),
    board_code = COALESCE(p.board_code, 'APT_FREE')
FROM posts p
WHERE l.post_id = p.id
  AND (l.board_scope IS NULL OR l.board_code IS NULL);

UPDATE post_view_logs
SET board_scope = COALESCE(board_scope, 'APARTMENT'),
    board_code = COALESCE(board_code, 'APT_FREE');

UPDATE post_like_logs
SET board_scope = COALESCE(board_scope, 'APARTMENT'),
    board_code = COALESCE(board_code, 'APT_FREE');

UPDATE keyword_logs
SET board_scope = COALESCE(board_scope, CASE WHEN apt_id IS NULL THEN 'GLOBAL' ELSE 'APARTMENT' END),
    board_code = COALESCE(board_code, CASE WHEN apt_id IS NULL THEN 'BLAH' ELSE 'APT_FREE' END);

ALTER TABLE post_view_logs
    ALTER COLUMN board_scope SET NOT NULL,
    ALTER COLUMN board_code SET NOT NULL;

ALTER TABLE post_like_logs
    ALTER COLUMN board_scope SET NOT NULL,
    ALTER COLUMN board_code SET NOT NULL;

ALTER TABLE keyword_logs
    ALTER COLUMN board_scope SET NOT NULL,
    ALTER COLUMN board_code SET NOT NULL;

-- ── 2. post_stats를 게시판 scope 기준으로 확장 ─────────────────

ALTER TABLE post_stats
    ALTER COLUMN apt_id DROP NOT NULL;

ALTER TABLE post_stats
    ADD COLUMN IF NOT EXISTS board_scope VARCHAR(20),
    ADD COLUMN IF NOT EXISTS board_code VARCHAR(40);

UPDATE post_stats s
SET board_scope = p.board_scope,
    board_code = p.board_code,
    apt_id = p.apt_id
FROM posts p
WHERE s.post_id = p.id
  AND (s.board_scope IS NULL OR s.board_code IS NULL OR s.apt_id IS DISTINCT FROM p.apt_id);

UPDATE post_stats
SET board_scope = COALESCE(board_scope, CASE WHEN apt_id IS NULL THEN 'GLOBAL' ELSE 'APARTMENT' END),
    board_code = COALESCE(board_code, CASE WHEN apt_id IS NULL THEN 'BLAH' ELSE 'APT_FREE' END);

ALTER TABLE post_stats
    ALTER COLUMN board_scope SET NOT NULL,
    ALTER COLUMN board_code SET NOT NULL;

-- 기존 통계가 없는 게시글도 랭킹 대상이 되도록 전체 posts 기준으로 보강한다.
INSERT INTO post_stats (
    post_id,
    apt_id,
    board_scope,
    board_code,
    view_count,
    like_count,
    comment_count,
    score,
    post_created_at,
    updated_at
)
SELECT
    p.id,
    p.apt_id,
    p.board_scope,
    p.board_code,
    COALESCE(v.view_count, 0),
    p.like_count,
    p.comment_count,
    (p.like_count * 2 + p.comment_count),
    p.created_at,
    NOW()
FROM posts p
LEFT JOIN (
    SELECT post_id, COUNT(*) AS view_count
    FROM post_view_logs
    GROUP BY post_id
) v ON v.post_id = p.id
ON CONFLICT (post_id) DO UPDATE SET
    apt_id = EXCLUDED.apt_id,
    board_scope = EXCLUDED.board_scope,
    board_code = EXCLUDED.board_code,
    view_count = EXCLUDED.view_count,
    like_count = EXCLUDED.like_count,
    comment_count = EXCLUDED.comment_count,
    score = EXCLUDED.score,
    post_created_at = EXCLUDED.post_created_at,
    updated_at = EXCLUDED.updated_at;

CREATE INDEX IF NOT EXISTS idx_post_stats_scope_score
    ON post_stats(board_scope, board_code, score DESC, post_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_stats_scope_comment
    ON post_stats(board_scope, board_code, comment_count DESC, post_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_stats_apartment_scope_score
    ON post_stats(board_scope, apt_id, board_code, score DESC, post_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_stats_apartment_scope_comment
    ON post_stats(board_scope, apt_id, board_code, comment_count DESC, post_created_at DESC);

-- ── 3. keyword_stats를 게시판 scope 기준으로 재구성 ─────────────
-- keyword_stats는 파생 데이터이므로 기존 row를 새 차원 기준으로 재집계한다.
-- apt_id가 null인 GLOBAL row도 유일성 보장을 위해 scope_apt_key(-1)를 별도로 둔다.

ALTER TABLE keyword_stats
    DROP CONSTRAINT IF EXISTS pk_keyword_stats;

ALTER TABLE keyword_stats
    ADD COLUMN IF NOT EXISTS id BIGINT,
    ADD COLUMN IF NOT EXISTS board_scope VARCHAR(20),
    ADD COLUMN IF NOT EXISTS board_code VARCHAR(40),
    ADD COLUMN IF NOT EXISTS scope_apt_key BIGINT;

CREATE SEQUENCE IF NOT EXISTS keyword_stats_id_seq;

UPDATE keyword_stats
SET id = nextval('keyword_stats_id_seq')
WHERE id IS NULL;

ALTER TABLE keyword_stats
    ALTER COLUMN id SET DEFAULT nextval('keyword_stats_id_seq'),
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN apt_id DROP NOT NULL;

UPDATE keyword_stats
SET board_scope = COALESCE(board_scope, CASE WHEN apt_id IS NULL THEN 'GLOBAL' ELSE 'APARTMENT' END),
    board_code = COALESCE(board_code, CASE WHEN apt_id IS NULL THEN 'BLAH' ELSE 'APT_FREE' END),
    scope_apt_key = COALESCE(scope_apt_key, COALESCE(apt_id, -1));

ALTER TABLE keyword_stats
    ALTER COLUMN board_scope SET NOT NULL,
    ALTER COLUMN board_code SET NOT NULL,
    ALTER COLUMN scope_apt_key SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pk_keyword_stats'
          AND conrelid = 'keyword_stats'::regclass
    ) THEN
        ALTER TABLE keyword_stats ADD CONSTRAINT pk_keyword_stats PRIMARY KEY (id);
    END IF;
END $$;

TRUNCATE TABLE keyword_stats;

INSERT INTO keyword_stats (
    keyword,
    apt_id,
    board_scope,
    board_code,
    scope_apt_key,
    stat_date,
    count
)
SELECT
    l.keyword,
    l.apt_id,
    l.board_scope,
    l.board_code,
    COALESCE(l.apt_id, -1) AS scope_apt_key,
    l.created_at::DATE AS stat_date,
    COUNT(*) AS count
FROM keyword_logs l
WHERE l.created_at > NOW() - INTERVAL '30 days'
GROUP BY l.keyword, l.apt_id, l.board_scope, l.board_code, COALESCE(l.apt_id, -1), l.created_at::DATE;

CREATE UNIQUE INDEX IF NOT EXISTS uk_keyword_stats_scope_board_apt_date_keyword
    ON keyword_stats(keyword, board_scope, board_code, scope_apt_key, stat_date);

CREATE INDEX IF NOT EXISTS idx_keyword_stats_scope_board_date
    ON keyword_stats(board_scope, board_code, scope_apt_key, stat_date DESC);
